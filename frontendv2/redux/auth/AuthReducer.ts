import { AuthState } from './AuthModel';
import * as actionTypes from './AuthActionType';

const initialState: AuthState = {
    jwt: null,
    reqUser: null,
    searchUser: [],
};

export const authReducer = (state: AuthState = initialState, action: any): AuthState => {
    switch (action.type) {
        case actionTypes.REGISTER:
        case actionTypes.LOGIN:
            return { ...state, jwt: action.payload.token };
        case actionTypes.CURRENT_USER:
            return { ...state, reqUser: action.payload };
        case actionTypes.SEARCH_USER:
            return { ...state, searchUser: action.payload };
        case actionTypes.UPDATE_USER:
            return { ...state, reqUser: action.payload };
        case actionTypes.LOGOUT:
            return { jwt: null, reqUser: null, searchUser: [] };
        default:
            return state;
    }
};
