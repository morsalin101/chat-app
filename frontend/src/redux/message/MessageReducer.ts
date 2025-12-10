import {MessageReducerState} from "./MessageModel";
import {Action} from "../CommonModel";
import * as actionTypes from './MessageActionType';

const initialState: MessageReducerState = {
    messages: [],
    newMessage: null,
};

const messageReducer = (state: MessageReducerState = initialState, action: Action): MessageReducerState => {
    switch (action.type) {
        case actionTypes.CREATE_NEW_MESSAGE:
            return {...state, newMessage: action.payload};
        case actionTypes.GET_ALL_MESSAGES:
            return {...state, messages: action.payload};
        case actionTypes.RECEIVE_MESSAGE:
            // Add received message to messages array if not already present
            const messageExists = state.messages.some((m: any) => m.id === action.payload.id);
            if (messageExists) {
                return state;
            }
            return {...state, messages: [...state.messages, action.payload]};
    }
    return state;
};

export default messageReducer;