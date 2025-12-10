import { AppDispatch } from '../Store';
import * as actionTypes from './CallActionType';
import { UserDTO } from '../auth/AuthModel';

export const initiateCall = (receiver: UserDTO, callType: 'voice' | 'video') => (dispatch: AppDispatch) => {
    dispatch({
        type: actionTypes.INITIATE_CALL,
        payload: {
            receiver,
            callType,
            isIncoming: false,
        },
    });
};

export const incomingCall = (caller: UserDTO, callType: 'voice' | 'video', callId: string) => (dispatch: AppDispatch) => {
    dispatch({
        type: actionTypes.INCOMING_CALL,
        payload: {
            caller,
            callType,
            callId,
            isIncoming: true,
        },
    });
};

export const acceptCall = () => (dispatch: AppDispatch) => {
    dispatch({ type: actionTypes.ACCEPT_CALL });
};

export const rejectCall = () => (dispatch: AppDispatch) => {
    dispatch({ type: actionTypes.REJECT_CALL });
};

export const endCall = () => (dispatch: AppDispatch) => {
    dispatch({ type: actionTypes.END_CALL });
};

export const updateCallStatus = (status: 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'rejected') => (dispatch: AppDispatch) => {
    dispatch({
        type: actionTypes.UPDATE_CALL_STATUS,
        payload: status,
    });
};

export const setLocalStream = (stream: MediaStream | null) => (dispatch: AppDispatch) => {
    dispatch({
        type: actionTypes.SET_LOCAL_STREAM,
        payload: stream,
    });
};

export const setRemoteStream = (stream: MediaStream | null) => (dispatch: AppDispatch) => {
    dispatch({
        type: actionTypes.SET_REMOTE_STREAM,
        payload: stream,
    });
};

export const resetCall = () => (dispatch: AppDispatch) => {
    dispatch({ type: actionTypes.RESET_CALL });
};
