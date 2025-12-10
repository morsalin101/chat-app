import { AppDispatch } from '../Store';
import { BASE_API_URL } from '../../config/Config';
import { AUTHORIZATION_PREFIX } from '../Constants';
import * as actionTypes from './MessageActionType';
import { MessageDTO, SendMessageRequest } from './MessageModel';

const MESSAGE_PATH = 'api/messages';

export const createMessage = (data: SendMessageRequest, token: string) => async (dispatch: AppDispatch): Promise<void> => {
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
        dispatch({ type: actionTypes.CREATE_NEW_MESSAGE, payload: JSON.parse(JSON.stringify(resData)) });
    } catch (error: any) {
        console.error('Sending message failed', error);
    }
};

export const getAllMessages = (chatId: string, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        console.log('[MessageAction] Fetching messages for chat:', chatId);
        const res: Response = await fetch(`${BASE_API_URL}/${MESSAGE_PATH}/chat/${chatId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            }
        });

        const resData: MessageDTO[] = await res.json();
        console.log('[MessageAction] Getting messages: ', resData);
        console.log('[MessageAction] Dispatching GET_ALL_MESSAGES with count:', resData.length);
        dispatch({ type: actionTypes.GET_ALL_MESSAGES, payload: JSON.parse(JSON.stringify(resData)) });
    } catch (error: any) {
        console.error('Getting messages failed: ', error);
    }
};

export const receiveMessage = (message: MessageDTO) => ({
    type: actionTypes.RECEIVE_MESSAGE,
    payload: message
});

export const clearMessages = () => ({
    type: actionTypes.CLEAR_MESSAGES
});
