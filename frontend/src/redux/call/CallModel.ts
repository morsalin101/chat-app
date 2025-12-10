import {UUID} from "node:crypto";
import {UserDTO} from "../auth/AuthModel";

export type CallType = 'voice' | 'video';
export type CallStatus = 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'rejected';

export interface CallState {
    status: CallStatus;
    callType: CallType | null;
    caller: UserDTO | null;
    receiver: UserDTO | null;
    isIncoming: boolean;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
}

export type CallReducerState = {
    currentCall: CallState;
};

