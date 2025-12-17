import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Phone, Video, Paperclip, FileIcon } from "lucide-react";
import { useChatStore } from "@/store/useChatStore";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useAuthStore } from "@/store/useAuthStore";
import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { FileUploader } from "@/components/common/FileUploader";
import { useCallStore } from "@/store/useCallStore";
import { toast } from "sonner";

export const ChatInterface = () => {
    const { currentConversation, messages } = useChatStore();
    const { user } = useAuthStore();
    const { sendMessage } = useChatMessages();
    const { setCallActive } = useCallStore();
    const [inputValue, setInputValue] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;
        await sendMessage(inputValue);
        setInputValue("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    const handleUploadComplete = async (url: string, type: 'image' | 'file', name: string) => {
        await sendMessage(name, type, url);
    };

    const startCall = async (type: 'video' | 'audio') => {
        if (!currentConversation) {
            toast.error("Sélectionnez une conversation d'abord");
            return;
        }

        try {
            toast.info("Démarrage de l'appel...");
            setCallActive(true, type);
            // The actual WebRTC connection will be handled by App.tsx
        } catch (error) {
            console.error("Error starting call:", error);
            toast.error("Impossible de démarrer l'appel");
            setCallActive(false);
        }
    };

    if (!currentConversation) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background text-muted-foreground">
                Select a conversation to start chatting
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-background">
            {/* Header */}
            <div className="h-16 border-b flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <h3 className="font-semibold">Chat</h3>
                    <span className="text-xs text-green-500 flex items-center gap-1">● Active</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => startCall('audio')}><Phone className="h-5 w-5" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => startCall('video')}><Video className="h-5 w-5" /></Button>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((msg) => {
                        const isMe = msg.senderId === user?.uid;
                        return (
                            <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                <div className={cn(
                                    "max-w-[70%] text-sm p-3 rounded-lg",
                                    isMe ? "bg-primary text-primary-foreground" : "bg-muted"
                                )}>
                                    {msg.type === 'text' && <p>{msg.content}</p>}
                                    {msg.type === 'image' && (
                                        <div className="space-y-2">
                                            <img src={msg.fileUrl} alt="attachment" className="rounded-md max-h-60 object-cover" />
                                            {msg.content && <p>{msg.content}</p>}
                                        </div>
                                    )}
                                    {msg.type === 'file' && (
                                        <div className="flex items-center gap-2">
                                            <FileIcon className="h-4 w-4" />
                                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="underline break-all">
                                                {msg.content}
                                            </a>
                                        </div>
                                    )}
                                    <span className="text-[10px] opacity-70 block text-right mt-1">
                                        {(() => {
                                            try {
                                                let dateObj;
                                                if (typeof msg.timestamp === 'object' && msg.timestamp && 'toDate' in (msg.timestamp as any)) {
                                                    dateObj = (msg.timestamp as any).toDate();
                                                } else {
                                                    dateObj = msg.timestamp;
                                                }
                                                if (!dateObj) return "";
                                                return format(dateObj, 'HH:mm');
                                            } catch (e) {
                                                return "";
                                            }
                                        })()}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setIsUploadOpen(true)}>
                    <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                    placeholder="Type a message..."
                    className="flex-1"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <Button size="icon" onClick={handleSend}><Send className="h-5 w-5" /></Button>
            </div>

            <FileUploader
                open={isUploadOpen}
                onOpenChange={setIsUploadOpen}
                onUploadComplete={handleUploadComplete}
            />
        </div>
    );
};
