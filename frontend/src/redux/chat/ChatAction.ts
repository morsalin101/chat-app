import {BASE_API_URL} from "../../config/Config";
import * as actionTypes from './ChatActionType';
import {UUID} from "node:crypto";
import {ChatDTO, GroupChatRequestDTO} from "./ChatModel";
import {AUTHORIZATION_PREFIX} from "../Constants";
import {AppDispatch} from "../Store";
import {ApiResponseDTO} from "../auth/AuthModel";

const CHAT_PATH = 'api/chats';

export const createChat = (userId: UUID, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/single`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
            body: JSON.stringify(userId),
        });

        const resData: ChatDTO = await res.json();
        console.log('Created single chat: ', resData);
        dispatch({type: actionTypes.CREATE_CHAT, payload: JSON.parse(JSON.stringify(resData))});
    } catch (error: any) {
        console.error('Creating single chat failed: ', error);
    }
};

export const createGroupChat = (data: GroupChatRequestDTO, token: string) => async (dispatch: AppDispatch): Promise<void> => {
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
        console.log('Created group chat: ', resData);
        dispatch({type: actionTypes.CREATE_GROUP, payload: JSON.parse(JSON.stringify(resData))});
    } catch (error: any) {
        console.error('Creating group chat failed: ', error);
    }
};

export const getUserChats = (token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/user`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            }
        });

        const resData: ChatDTO[] = await res.json();
        console.log('Getting user chats: ', resData);
        // Clone data to prevent reference sharing with Redux state
        dispatch({type: actionTypes.GET_ALL_CHATS, payload: JSON.parse(JSON.stringify(resData))});
    } catch (error: any) {
        console.error('Getting user chats failed: ', error);
    }
};

export const deleteChat = (id: UUID, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/delete/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            }
        });

        const resData: ApiResponseDTO = await res.json();
        console.log('Deleted chat: ', resData);
        dispatch({type: actionTypes.DELETE_CHAT, payload: resData});
    } catch (error: any) {
        console.error('Deleting chat failed: ', error);
    }
};

export const addUserToGroupChat = (chatId: UUID, userId: UUID, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/${chatId}/add/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            }
        });

        const resData: ChatDTO = await res.json();
        console.log('Added user to group chat: ', resData);
        dispatch({type: actionTypes.ADD_MEMBER_TO_GROUP, payload: JSON.parse(JSON.stringify(resData))});
    } catch (error: any) {
        console.error('Adding user to group chat failed: ', error);
    }
};

export const removeUserFromGroupChat = (chatId: UUID, userId: UUID, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/${chatId}/remove/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            }
        });

        const resData: ChatDTO = await res.json();
        console.log('Removed user from group chat: ', resData);
        dispatch({type: actionTypes.REMOVE_MEMBER_FROM_GROUP, payload: JSON.parse(JSON.stringify(resData))});
    } catch (error: any) {
        console.error('Removing user from group chat failed: ', error);
    }
};

export const markChatAsRead = (chatId: UUID, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/${chatId}/markAsRead`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            }
        });

        const resData: ChatDTO = await res.json();
        console.log('Marked chat as read: ', resData);
        dispatch({type: actionTypes.MARK_CHAT_AS_READ, payload: JSON.parse(JSON.stringify(resData))});
    } catch (error: any) {
        console.error('Marking chat as read failed, ', error);
    }
};

export const uploadGroupPicture = (chatId: UUID, file: File, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const res: Response = await fetch(`${BASE_API_URL}/${CHAT_PATH}/${chatId}/picture`, {
            method: 'POST',
            headers: {
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
            body: formData,
        });

        const resData: ApiResponseDTO = await res.json();
        console.log('Uploaded group picture: ', resData);
        if (resData.status) {
            // Refresh chats to get updated picture
            dispatch(getUserChats(token));
        }
    } catch (error: any) {
        console.error('Uploading group picture failed: ', error);
    }
};