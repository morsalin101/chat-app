import {MessageDTO, SendMessageRequestDTO} from "./MessageModel";
import {AppDispatch} from "../Store";
import {BASE_API_URL} from "../../config/Config";
import {AUTHORIZATION_PREFIX} from "../Constants";
import * as actionTypes from './MessageActionType';
import {UUID} from "node:crypto";

const MESSAGE_PATH = 'api/messages';

export const createMessage = (data: SendMessageRequestDTO, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${MESSAGE_PATH}/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
            body: JSON.stringify(data),
        });

        const resData: MessageDTO = await res.json();
        console.log('Send message: ', resData);
        dispatch({type: actionTypes.CREATE_NEW_MESSAGE, payload: JSON.parse(JSON.stringify(resData))});
    } catch (error: any) {
        console.error('Sending message failed', error);
    }
};

export const getAllMessages = (chatId: UUID, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${MESSAGE_PATH}/chat/${chatId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            }
        });

        const resData: MessageDTO[] = await res.json();
        console.log('Getting messages: ', resData);
        dispatch({type: actionTypes.GET_ALL_MESSAGES, payload: JSON.parse(JSON.stringify(resData))});
    } catch (error: any) {
        console.error('Getting messages failed: ', error);
    }
};

export const receiveMessage = (message: MessageDTO) => ({
    type: actionTypes.RECEIVE_MESSAGE,
    payload: message
});

export const uploadFileMessage = (file: File, chatId: UUID, content: string, token: string) => 
    async (dispatch: AppDispatch): Promise<void> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('chatId', chatId);
        if (content) {
            formData.append('content', content);
        }

        const res: Response = await fetch(`${BASE_API_URL}/${MESSAGE_PATH}/upload`, {
            method: 'POST',
            headers: {
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
            body: formData,
        });

        const resData: MessageDTO = await res.json();
        console.log('File message sent: ', resData);
        dispatch({type: actionTypes.CREATE_NEW_MESSAGE, payload: JSON.parse(JSON.stringify(resData))});
    } catch (error: any) {
        console.error('Sending file message failed', error);
    }
};

export const downloadFile = async (messageId: UUID, fileName: string, token: string): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${MESSAGE_PATH}/download/${messageId}`, {
            method: 'GET',
            headers: {
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            }
        });

        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName || 'file';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    } catch (error: any) {
        console.error('Downloading file failed', error);
    }
};