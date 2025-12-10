import { AppDispatch } from '../Store';
import { BASE_API_URL } from '../../config/Config';
import { AUTHORIZATION_PREFIX } from '../Constants';
import * as actionTypes from './ChatActionType';
import { ChatDTO, CreateGroupRequest, CreateSingleChatRequest } from './ChatModel';

const CHAT_PATH = 'api/chats';

export const getUserChats = (token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/user`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const resData: ChatDTO[] = await res.json();
        console.log('Get user chats: ', resData);
        dispatch({ type: actionTypes.GET_ALL_CHATS, payload: JSON.parse(JSON.stringify(resData)) });
    } catch (error: any) {
        console.error('Getting chats failed: ', error);
        dispatch({ type: actionTypes.GET_ALL_CHATS, payload: [] });
    }
};

export const createGroupChat = (data: CreateGroupRequest, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/group`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
            body: JSON.stringify(data),
        });

        const resData: ChatDTO = await res.json();
        console.log('Create group: ', resData);
        dispatch({ type: actionTypes.CREATE_NEW_GROUP, payload: JSON.parse(JSON.stringify(resData)) });
    } catch (error: any) {
        console.error('Creating group failed: ', error);
    }
};

export const createSingleChat = (data: CreateSingleChatRequest, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/single`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
            body: JSON.stringify(data),
        });

        const resData: ChatDTO = await res.json();
        console.log('Create single chat: ', resData);
        dispatch({ type: actionTypes.CREATE_SINGLE_CHAT, payload: JSON.parse(JSON.stringify(resData)) });
    } catch (error: any) {
        console.error('Creating chat failed: ', error);
    }
};

export const deleteChat = (chatId: string, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/${chatId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
        });

        const resData: ChatDTO = await res.json();
        console.log('Delete chat: ', resData);
        dispatch({ type: actionTypes.DELETE_CHAT, payload: JSON.parse(JSON.stringify(resData)) });
    } catch (error: any) {
        console.error('Deleting chat failed: ', error);
    }
};

export const markChatAsRead = (chatId: string, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/${chatId}/read`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
        });

        const resData: ChatDTO = await res.json();
        console.log('Mark chat as read: ', resData);
        dispatch({ type: actionTypes.MARK_CHAT_AS_READ, payload: JSON.parse(JSON.stringify(resData)) });
    } catch (error: any) {
        console.error('Marking chat as read failed: ', error);
    }
};
