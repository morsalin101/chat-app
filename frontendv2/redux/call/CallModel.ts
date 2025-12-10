import { UserDTO } from '../auth/AuthModel';

export interface CallState {
    isCallModalOpen: boolean;
    currentCall: {
        callId: string | null;
        caller: UserDTO | null;
        receiver: UserDTO | null;
        callType: 'voice' | 'video';
        status: 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'rejected';
        isIncoming: boolean;
        localStream: MediaStream | null;
        remoteStream: MediaStream | null;
    };
}
