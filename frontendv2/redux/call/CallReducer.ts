import { CallState } from './CallModel';
import * as actionTypes from './CallActionType';

const initialState: CallState = {
    isCallModalOpen: false,
    currentCall: {
        callId: null,
        caller: null,
        receiver: null,
        callType: 'voice',
        status: 'idle',
        isIncoming: false,
        localStream: null,
        remoteStream: null,
    },
};

export const callReducer = (state: CallState = initialState, action: any): CallState => {
    switch (action.type) {
        case actionTypes.INITIATE_CALL:
            return {
                ...state,
                isCallModalOpen: true,
                currentCall: {
                    ...state.currentCall,
                    receiver: action.payload.receiver,
                    callType: action.payload.callType,
                    status: 'ringing',
                    isIncoming: false,
                    callId: Date.now().toString(),
                },
            };

        case actionTypes.INCOMING_CALL:
            return {
                ...state,
                isCallModalOpen: true,
                currentCall: {
                    ...state.currentCall,
                    caller: action.payload.caller,
                    callType: action.payload.callType,
                    callId: action.payload.callId,
                    status: 'ringing',
                    isIncoming: true,
                },
            };

        case actionTypes.ACCEPT_CALL:
            return {
                ...state,
                currentCall: {
                    ...state.currentCall,
                    status: 'connecting',
                },
            };

        case actionTypes.REJECT_CALL:
            return {
                ...state,
                isCallModalOpen: false,
                currentCall: {
                    ...initialState.currentCall,
                    status: 'rejected',
                },
            };

        case actionTypes.END_CALL:
            return {
                ...state,
                isCallModalOpen: false,
                currentCall: {
                    ...initialState.currentCall,
                    status: 'ended',
                },
            };

        case actionTypes.UPDATE_CALL_STATUS:
            return {
                ...state,
                currentCall: {
                    ...state.currentCall,
                    status: action.payload,
                },
            };

        case actionTypes.SET_LOCAL_STREAM:
            return {
                ...state,
                currentCall: {
                    ...state.currentCall,
                    localStream: action.payload,
                },
            };

        case actionTypes.SET_REMOTE_STREAM:
            return {
                ...state,
                currentCall: {
                    ...state.currentCall,
                    remoteStream: action.payload,
                },
            };

        case actionTypes.RESET_CALL:
            return initialState;

        default:
            return state;
    }
};
