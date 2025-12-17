import { useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import type { Message, Conversation } from "@/types";

export const useChatMessages = () => {
    const { user } = useAuthStore();
    const {
        setConversations,
        currentConversation,
        setMessages
    } = useChatStore();
    const [loading, setLoading] = useState(true);

    // Subscribe to conversations
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "conversations"),
            where("participants", "array-contains", user.uid),
            orderBy("updatedAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const convs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Conversation[];
            setConversations(convs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, setConversations]);

    // Subscribe to messages of current conversation
    useEffect(() => {
        if (!currentConversation) {
            setMessages([]);
            return;
        }

        const q = query(
            collection(db, "messages"),
            where("conversationId", "==", currentConversation.id),
            orderBy("timestamp", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Message[];
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [currentConversation, setMessages]);

    const sendMessage = async (content: string, type: 'text' | 'image' | 'file' = 'text', fileUrl?: string) => {
        if (!user || !currentConversation) return;

        const messageData: any = {
            conversationId: currentConversation.id,
            senderId: user.uid,
            content,
            type,
            timestamp: Date.now()
        };

        if (fileUrl) {
            messageData.fileUrl = fileUrl;
        }

        // Add message to subcollection or top-level collection (using top-level for easier queries usually, but kept simple here)
        // We used top level 'messages' in design
        await addDoc(collection(db, "messages"), {
            ...messageData,
            timestamp: serverTimestamp() // Use server timestamp for consistency
        });

        // Update conversation last message
        const convRef = doc(db, "conversations", currentConversation.id);
        await updateDoc(convRef, {
            lastMessage: type === 'text' ? content : `Sent a ${type}`,
            updatedAt: serverTimestamp()
        });
    };

    const createConversation = async (participantId: string) => {
        if (!user) return;

        // Check if conversation already exists (optional, simplified for now)

        const newConvRef = await addDoc(collection(db, "conversations"), {
            participants: [user.uid, participantId],
            type: 'private',
            updatedAt: serverTimestamp(),
            lastMessage: ''
        });

        return newConvRef.id;
    };

    return { loading, sendMessage, createConversation };
};
