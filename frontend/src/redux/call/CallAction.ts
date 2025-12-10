import {AppDispatch} from "../Store";
import * as actionTypes from './CallActionType';
import {CallType} from "./CallModel";
import {UserDTO} from "../auth/AuthModel";

export const initiateCall = (callType: CallType, caller: UserDTO, receiver: UserDTO) => ({
    type: actionTypes.INITIATE_CALL,
    payload: {callType, caller, receiver}
});

export const receiveCall = (callType: CallType, caller: UserDTO, receiver: UserDTO) => ({
    type: actionTypes.RECEIVE_CALL,
    payload: {callType, caller, receiver}
});

export const acceptCall = () => ({
    type: actionTypes.ACCEPT_CALL
});

export const rejectCall = () => ({
    type: actionTypes.REJECT_CALL
});

export const endCall = () => ({
    type: actionTypes.END_CALL
});

export const updateCallStatus = (status: string) => ({
    type: actionTypes.UPDATE_CALL_STATUS,
    payload: {status}
});

export const setLocalStream = (stream: MediaStream | null) => ({
    type: actionTypes.SET_LOCAL_STREAM,
    payload: stream
});

export const setRemoteStream = (stream: MediaStream | null) => ({
    type: actionTypes.SET_REMOTE_STREAM,
    payload: stream
});

