import { useState, useRef } from "react";
import {
    collection,
    doc,
    setDoc,
    onSnapshot,
    addDoc,
    updateDoc,
    getDoc
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuthStore } from "@/store/useAuthStore";

const servers = {
    iceServers: [
        {
            urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
        },
    ],
    iceCandidatePoolSize: 10,
};

export const useVideoCall = () => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'active'>('idle');
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const { user } = useAuthStore();

    const setupSources = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        return stream;
    };

    const createCall = async (conversationId: string) => {
        if (!user) return;
        const stream = await setupSources();

        const pc = new RTCPeerConnection(servers);
        peerConnection.current = pc;

        // Add local tracks to PC
        stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
        });

        // Pull remote tracks
        pc.ontrack = (event) => {
            event.streams[0] && setRemoteStream(event.streams[0]);
        };

        // Create Call Document
        const callDocRef = doc(collection(db, "calls"));
        const offerCandidates = collection(callDocRef, "offerCandidates");
        const answerCandidates = collection(callDocRef, "answerCandidates");

        pc.onicecandidate = (event) => {
            event.candidate && addDoc(offerCandidates, event.candidate.toJSON());
        };

        // Create Offer
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);

        const callData = {
            offer: { type: offerDescription.type, sdp: offerDescription.sdp },
            conversationId,
            participants: [user.uid],
            status: 'calling',
            createdAt: Date.now()
        };
        await setDoc(callDocRef, callData);

        // Listen for Answer
        onSnapshot(callDocRef, (snapshot) => {
            const data = snapshot.data();
            if (!pc.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                pc.setRemoteDescription(answerDescription);
                setCallStatus('active');
            }
        });

        // Listen for Answer ICE Candidates
        onSnapshot(answerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    pc.addIceCandidate(candidate);
                }
            });
        });

        return callDocRef.id;
    };

    const joinCall = async (callId: string) => {
        const stream = await setupSources();
        const pc = new RTCPeerConnection(servers);
        peerConnection.current = pc;

        // Add local tracks
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
            event.streams[0] && setRemoteStream(event.streams[0]);
        };

        const callDocRef = doc(db, "calls", callId);
        const answerCandidates = collection(callDocRef, "answerCandidates");
        const offerCandidates = collection(callDocRef, "offerCandidates");

        pc.onicecandidate = (event) => {
            event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
        };

        // Get Offer
        const callSnapshot = await getDoc(callDocRef);
        const callData = callSnapshot.data();

        // Set Remote Description
        const offerDescription = callData?.offer;
        await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

        // Create Answer
        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);

        const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
        };

        await updateDoc(callDocRef, { answer, status: 'active' });
        setCallStatus('active');

        // Listen for Offer ICE Candidates
        onSnapshot(offerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    pc.addIceCandidate(candidate);
                }
            });
        });
    };

    const endCall = async (callId?: string) => {
        peerConnection.current?.close();
        peerConnection.current = null;
        setLocalStream(null);
        setRemoteStream(null);
        setCallStatus('idle');

        if (callId) {
            // Ideally delete doc or set status ended
            // await deleteDoc(doc(db, "calls", callId));
        }
        window.location.reload(); // Quick reset for now
    };

    return { createCall, joinCall, endCall, localStream, remoteStream, callStatus };
};
