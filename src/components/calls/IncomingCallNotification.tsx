import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Video } from "lucide-react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";

interface IncomingCallNotificationProps {
    onAccept: (callId: string) => void;
}

export const IncomingCallNotification = ({ onAccept }: IncomingCallNotificationProps) => {
    const [incomingCall, setIncomingCall] = useState<{ id: string; conversationId: string } | null>(null);
    const { user } = useAuthStore();
    const { currentConversation } = useChatStore();

    useEffect(() => {
        if (!user || !currentConversation) return;

        // Listen for incoming calls in the current conversation
        const callsRef = collection(db, "calls");
        const q = query(
            callsRef,
            where("conversationId", "==", currentConversation.id),
            where("status", "==", "calling")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const callData = change.doc.data();
                    // Only show notification if we're not the caller
                    if (!callData.participants.includes(user.uid)) {
                        setIncomingCall({
                            id: change.doc.id,
                            conversationId: callData.conversationId
                        });
                    }
                }
            });
        });

        return () => unsubscribe();
    }, [user, currentConversation]);

    const handleAccept = () => {
        if (incomingCall) {
            onAccept(incomingCall.id);
            setIncomingCall(null);
        }
    };

    const handleReject = async () => {
        if (incomingCall) {
            // Update call status to rejected
            const callRef = doc(db, "calls", incomingCall.id);
            await updateDoc(callRef, { status: "rejected" });
            setIncomingCall(null);
        }
    };

    return (
        <Dialog open={!!incomingCall} onOpenChange={(open) => !open && handleReject()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5 text-primary" />
                        Appel vidéo entrant
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-6 py-6">
                    <div className="text-center">
                        <p className="text-lg font-medium">Un utilisateur vous appelle</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Voulez-vous répondre ?
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            variant="destructive"
                            size="lg"
                            className="rounded-full h-14 w-14"
                            onClick={handleReject}
                        >
                            <PhoneOff className="h-6 w-6" />
                        </Button>
                        <Button
                            variant="default"
                            size="lg"
                            className="rounded-full h-14 w-14 bg-green-600 hover:bg-green-700"
                            onClick={handleAccept}
                        >
                            <Phone className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
