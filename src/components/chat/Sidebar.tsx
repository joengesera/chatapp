import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatMessages } from "@/hooks/useChatMessages";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { NewChatDialog } from "./NewChatDialog";

export const Sidebar = () => {
    const { conversations, setCurrentConversation, currentConversation } = useChatStore();
    const { user } = useAuthStore();
    useChatMessages(); // Initialize listeners

    const getOtherParticipant = (participants: string[]) => {
        // In a real app, you would fetch user details. 
        // For now, we'll just show the ID or a placeholder if it's not the current user.
        const otherId = participants.find(p => p !== user?.uid);
        return { name: otherId ? `User ${otherId.slice(0, 4)}` : "Unknown", avatar: "" };
    };

    return (
        <div className="w-80 h-full border-r bg-background flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Messages</h2>
                <NewChatDialog />
            </div>
            <ScrollArea className="flex-1">
                <div className="space-y-2 p-2">
                    {conversations.map((conv) => {
                        const otherUser = getOtherParticipant(conv.participants);
                        return (
                            <div
                                key={conv.id}
                                onClick={() => setCurrentConversation(conv)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors",
                                    currentConversation?.id === conv.id && "bg-muted"
                                )}
                            >
                                <Avatar>
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.name}`} />
                                    <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="overflow-hidden flex-1">
                                    <div className="flex justify-between items-center">
                                        <p className="font-medium truncate">{otherUser.name}</p>
                                        {conv.updatedAt && (
                                            <span className="text-xs text-muted-foreground">
                                                {(() => {
                                                    try {
                                                        let dateObj;
                                                        // Handle Firebase Timestamp
                                                        if (typeof conv.updatedAt === 'object' && conv.updatedAt && 'toDate' in (conv.updatedAt as any)) {
                                                            dateObj = (conv.updatedAt as any).toDate();
                                                        } else {
                                                            dateObj = conv.updatedAt;
                                                        }
                                                        // Ensure it's a valid date object or number before formatting
                                                        if (!dateObj) return "";

                                                        // Fallback for invalid date strings/numbers
                                                        return format(dateObj, 'HH:mm');
                                                    } catch (e) {
                                                        return "";
                                                    }
                                                })()}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessage || "No messages yet"}</p>
                                </div>
                            </div>
                        )
                    })}
                    {conversations.length === 0 && (
                        <div className="p-4 text-center text-muted-foreground">
                            No conversations yet.
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};
