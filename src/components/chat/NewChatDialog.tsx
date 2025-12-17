import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "@/services/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { useChatMessages } from "@/hooks/useChatMessages";
import { toast } from "sonner";
import type { User } from "@/types";

export const NewChatDialog = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const { user: currentUser } = useAuthStore();
    const { createConversation } = useChatMessages();

    // Fetch users when dialog opens
    useEffect(() => {
        if (isOpen && currentUser) {
            const fetchUsers = async () => {
                setLoading(true);
                try {
                    // Ideally, use a search index like Algolia or a simple text search if collection is small
                    // For this demo, fetch all users and filter client-side (NOT for production with many users)
                    // Or query by exact match/prefix if needed. 
                    const usersRef = collection(db, "users");
                    const q = query(usersRef, where("uid", "!=", currentUser.uid)); // Don't show self
                    const snapshot = await getDocs(q);
                    const fetchedUsers = snapshot.docs.map(doc => ({
                        uid: doc.id,
                        ...doc.data()
                    })) as User[];
                    setUsers(fetchedUsers);
                } catch (error) {
                    console.error("Error fetching users:", error);
                    toast.error("Failed to load users");
                } finally {
                    setLoading(false);
                }
            };
            fetchUsers();
        }
    }, [isOpen, currentUser]);

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleStartChat = async (otherUser: User) => {
        try {
            setLoading(true);
            const convId = await createConversation(otherUser.uid);
            setIsOpen(false);
            if (convId) {
                toast.success(`Started chat with ${otherUser.name}`);
            }
        } catch (error) {
            console.error("Error creating chat:", error);
            toast.error("Failed to start chat");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost">
                    <Plus className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Message</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ScrollArea className="h-[300px] border rounded-md p-2">
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredUsers.length > 0 ? (
                            <div className="space-y-2">
                                {filteredUsers.map((u) => (
                                    <div
                                        key={u.uid}
                                        onClick={() => handleStartChat(u)}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                                    >
                                        <Avatar>
                                            <AvatarImage src={u.avatar} />
                                            <AvatarFallback>{u.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-medium truncate">{u.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                No users found.
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
};
