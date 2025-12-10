import {CallReducerState, CallState} from "./CallModel";
import * as actionTypes from './CallActionType';

const initialState: CallReducerState = {
    currentCall: {
        status: 'idle',
        callType: null,
        caller: null,
        receiver: null,
        isIncoming: false,
        localStream: null, // Keep for compatibility but won't be used
        remoteStream: null  // Keep for compatibility but won't be used
    }
};

export const callReducer = (state: CallReducerState = initialState, action: any): CallReducerState => {
    switch (action.type) {
        case actionTypes.INITIATE_CALL:
            return {
                ...state,
                currentCall: {
                    status: 'ringing',
                    callType: action.payload.callType,
                    caller: action.payload.caller,
                    receiver: action.payload.receiver,
                    isIncoming: false,
                    localStream: null,
                    remoteStream: null
                }
            };

        case actionTypes.RECEIVE_CALL:
            return {
                ...state,
                currentCall: {
                    status: 'ringing',
                    callType: action.payload.callType,
                    caller: action.payload.caller,
                    receiver: action.payload.receiver,
                    isIncoming: true,
                    localStream: null,
                    remoteStream: null
                }
            };

        case actionTypes.ACCEPT_CALL:
            return {
                ...state,
                currentCall: {
                    ...state.currentCall,
                    status: 'connecting'
                }
            };

        case actionTypes.UPDATE_CALL_STATUS:
            return {
                ...state,
                currentCall: {
                    ...state.currentCall,
                    status: action.payload.status
                }
            };

        case actionTypes.SET_LOCAL_STREAM:
            // Don't store MediaStream in Redux to avoid mutation errors
            // Streams are managed in component refs
            return state;

        case actionTypes.SET_REMOTE_STREAM:
            // Don't store MediaStream in Redux to avoid mutation errors
            // Streams are managed in component refs
            return state;

        case actionTypes.REJECT_CALL:
        case actionTypes.END_CALL:
            return {
                ...state,
                currentCall: {
                    status: 'idle',
                    callType: null,
                    caller: null,
                    receiver: null,
                    isIncoming: false,
                    localStream: null,
                    remoteStream: null
                }
            };

        default:
            return state;
    }
};

