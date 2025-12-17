import { useRef, useEffect } from "react";
import { Mic, Video, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoCallRoomProps {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    onEndCall: () => void;
    minimized?: boolean;
}

export const VideoCallRoom = ({ localStream, remoteStream, onEndCall, minimized = false }: VideoCallRoomProps) => {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    if (!localStream && !remoteStream) return null;

    return (
        <div className={cn(
            "fixed transition-all duration-300 shadow-2xl overflow-hidden bg-black z-50",
            minimized ? "bottom-4 right-4 w-64 h-48 rounded-xl" : "inset-0 flex items-center justify-center rounded-none"
        )}>
            {/* Remote Video (Main) */}
            <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="text-white text-center">
                        <div className="animate-pulse mb-2">Connecting...</div>
                        <p className="text-sm text-slate-400">Waiting for other participant</p>
                    </div>
                )}
            </div>

            {/* Local Video (PiP inside) */}
            <div className={cn(
                "absolute transition-all duration-300 bg-slate-800 border-2 border-slate-700 shadow-lg",
                minimized ? "bottom-2 right-2 w-16 h-12 rounded-md" : "bottom-8 right-8 w-48 h-36 rounded-xl"
            )}>
                <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-lg" // Fixed radius for inner
                />
            </div>

            {/* Controls */}
            {!minimized && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 p-4 rounded-full backdrop-blur-sm">
                    <Button variant="outline" size="icon" className="rounded-full bg-slate-700 hover:bg-slate-600 border-none text-white">
                        <Mic className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full bg-slate-700 hover:bg-slate-600 border-none text-white">
                        <Video className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="destructive"
                        size="icon"
                        className="rounded-full h-12 w-12"
                        onClick={onEndCall}
                    >
                        <PhoneOff className="h-6 w-6" />
                    </Button>
                </div>
            )}
        </div>
    );
};
