import { create } from 'zustand';
import type { Conversation, Message } from '../types';

interface ChatState {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    messages: Message[];
    setConversations: (conversations: Conversation[]) => void;
    setCurrentConversation: (conversation: Conversation | null) => void;
    setMessages: (messages: Message[]) => void;
    addMessage: (message: Message) => void;
}

export const useChatStore = create<ChatState>((set) => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    setConversations: (conversations) => set({ conversations }),
    setCurrentConversation: (currentConversation) => set({ currentConversation }),
    setMessages: (messages) => set({ messages }),
    addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
}));
