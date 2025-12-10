import { MessageState } from './MessageModel';
import * as actionTypes from './MessageActionType';

const initialState: MessageState = {
    messages: [],
    newMessage: null,
};

const messageReducer = (state: MessageState = initialState, action: any): MessageState => {
    switch (action.type) {
        case actionTypes.CREATE_NEW_MESSAGE:
            // Add sent message to messages array immediately for real-time display
            const sentMessageExists = state.messages.some((m: any) => m.id === action.payload.id);
            if (sentMessageExists) {
                console.log('[Reducer] Message already exists, not adding');
                return { ...state, newMessage: action.payload };
            }
            console.log('[Reducer] Adding sent message to state');
            return { 
                ...state, 
                newMessage: action.payload,
                messages: [...state.messages, action.payload]
            };
        case actionTypes.GET_ALL_MESSAGES:
            console.log('[Reducer] Loading all messages, count:', action.payload.length);
            return { ...state, messages: action.payload };
        case actionTypes.RECEIVE_MESSAGE:
            const messageExists = state.messages.some((m: any) => m.id === action.payload.id);
            if (messageExists) {
                console.log('[Reducer] Received message already exists, not adding');
                return state;
            }
            console.log('[Reducer] Adding received message to state, new count:', state.messages.length + 1);
            return { ...state, messages: [...state.messages, action.payload] };
        case actionTypes.CLEAR_MESSAGES:
            return { ...state, messages: [], newMessage: null };
        default:
            return state;
    }
};

export default messageReducer;
