import { ChatState } from './ChatModel';
import * as actionTypes from './ChatActionType';

const initialState: ChatState = {
    chats: [],
    createdGroup: null,
    createdChat: null,
    deletedChat: null,
    editedGroup: null,
    markedAsReadChat: null,
};

export const chatReducer = (state: ChatState = initialState, action: any): ChatState => {
    switch (action.type) {
        case actionTypes.GET_ALL_CHATS:
            return { ...state, chats: action.payload };
        case actionTypes.CREATE_NEW_GROUP:
            return { ...state, createdGroup: action.payload };
        case actionTypes.CREATE_SINGLE_CHAT:
            return { ...state, createdChat: action.payload };
        case actionTypes.DELETE_CHAT:
            return { ...state, deletedChat: action.payload };
        case actionTypes.EDIT_GROUP_CHAT:
            return { ...state, editedGroup: action.payload };
        case actionTypes.MARK_CHAT_AS_READ:
            return { ...state, markedAsReadChat: action.payload };
        default:
            return state;
    }
};
