import { create } from 'zustand';

interface CallState {
    isCallActive: boolean;
    isMinimized: boolean;
    callType: 'video' | 'audio' | null;
    roomId: string | null;
    setCallActive: (active: boolean, type?: 'video' | 'audio' | null, roomId?: string | null) => void;
    setMinimized: (minimized: boolean) => void;
}

export const useCallStore = create<CallState>((set) => ({
    isCallActive: false,
    isMinimized: false,
    callType: null,
    roomId: null,
    setCallActive: (active, type = null, roomId = null) =>
        set({ isCallActive: active, callType: type, roomId: roomId }),
    setMinimized: (minimized) => set({ isMinimized: minimized }),
}));
