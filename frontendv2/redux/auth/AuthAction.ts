import { AppDispatch } from '../Store';
import { BASE_API_URL, TOKEN } from '../../config/Config';
import { AUTHORIZATION_PREFIX } from '../Constants';
import * as actionTypes from './AuthActionType';
import { SignInRequest, SignUpRequest, AuthResponse, UserDTO } from './AuthModel';

const AUTH_PATH = 'auth';

export const register = (data: SignUpRequest) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${AUTH_PATH}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const resData: AuthResponse = await res.json();
        
        if (resData.token) {
            localStorage.setItem(TOKEN, resData.token);
        }
        console.log('Sign up: ', resData);
        dispatch({ type: actionTypes.REGISTER, payload: resData });
    } catch (error: any) {
        console.error('Sign up failed: ', error);
    }
};

export const login = (data: SignInRequest) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/${AUTH_PATH}/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const resData: AuthResponse = await res.json();
        
        if (resData.token) {
            localStorage.setItem(TOKEN, resData.token);
        }
        console.log('Sign in: ', resData);
        dispatch({ type: actionTypes.LOGIN, payload: resData });
    } catch (error: any) {
        console.error('Sign in failed: ', error);
    }
};

export const currentUser = (token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/api/user/profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const resData: UserDTO = await res.json();
        console.log('Current user: ', resData);
        dispatch({ type: actionTypes.CURRENT_USER, payload: resData });
    } catch (error: any) {
        console.error('Getting current user failed: ', error);
    }
};

export const searchUser = (username: string, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/api/user/search?name=${username}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
        });

        const resData: UserDTO[] = await res.json();
        console.log('Search user: ', resData);
        dispatch({ type: actionTypes.SEARCH_USER, payload: resData });
    } catch (error: any) {
        console.error('Search user failed: ', error);
    }
};

export const updateUser = (data: any, token: string) => async (dispatch: AppDispatch): Promise<void> => {
    try {
        const res: Response = await fetch(`${BASE_API_URL}/api/user/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${AUTHORIZATION_PREFIX}${token}`,
            },
            body: JSON.stringify(data),
        });

        const resData: UserDTO = await res.json();
        console.log('Update user: ', resData);
        dispatch({ type: actionTypes.UPDATE_USER, payload: resData });
    } catch (error: any) {
        console.error('Update user failed: ', error);
    }
};

export const logoutUser = () => async (dispatch: AppDispatch): Promise<void> => {
    localStorage.removeItem(TOKEN);
    dispatch({ type: actionTypes.LOGOUT, payload: null });
};
