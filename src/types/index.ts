export interface User {
    uid: string;
    name: string;
    email: string;
    avatar?: string;
    online: boolean;
}

export interface Conversation {
    id: string;
    participants: string[]; // User UIDs
    type: 'private' | 'group';
    lastMessage?: string;
    updatedAt: any; // Can be number or Firebase Timestamp
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    type: 'text' | 'image' | 'file';
    fileUrl?: string; // For images/files
    fileName?: string;
    fileSize?: number;
    timestamp: any; // Can be number or Firebase Timestamp
}

export interface Call {
    id: string;
    participants: string[];
    status: 'active' | 'ended';
    startTime: number;
    endTime?: number;
}
