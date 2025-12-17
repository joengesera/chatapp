import { Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Login } from "@/pages/Login";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Toaster } from "@/components/ui/sonner";
import { VideoCallRoom } from "@/components/calls/VideoCallRoom";
import { useVideoCall } from "@/hooks/useVideoCall";
import { useCallStore } from "@/store/useCallStore";
import { useEffect } from "react";
import { auth } from "@/services/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatStore } from "@/store/useChatStore";
import { IncomingCallNotification } from "@/components/calls/IncomingCallNotification";

function App() {
  const { isCallActive, isMinimized, setCallActive } = useCallStore();
  const { createCall, joinCall, localStream, remoteStream, endCall } = useVideoCall();
  const { setUser, setLoading } = useAuthStore();
  const { currentConversation } = useChatStore();

  useEffect(() => {
    // Listen for auth state changes (refresh, new tab, etc.)
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser({
          uid: user.uid,
          name: user.displayName || "User",
          email: user.email || "",
          avatar: user.photoURL || "",
          online: true
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser, setLoading]);

  // Start call when call becomes active
  useEffect(() => {
    if (isCallActive && currentConversation && !localStream) {
      createCall(currentConversation.id);
    }
  }, [isCallActive, currentConversation, localStream, createCall]);

  const handleEndCall = () => {
    endCall();
    setCallActive(false);
  }

  const handleAcceptCall = async (callId: string) => {
    setCallActive(true, 'video');
    await joinCall(callId);
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div className="flex h-screen w-screen overflow-hidden bg-background font-sans text-foreground">
                <Sidebar />
                <ChatInterface />
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
      <IncomingCallNotification onAccept={handleAcceptCall} />
      {isCallActive && (
        <VideoCallRoom
          localStream={localStream}
          remoteStream={remoteStream}
          onEndCall={handleEndCall}
          minimized={isMinimized}
        />
      )}
    </>
  )
}

export default App
