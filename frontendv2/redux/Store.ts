import { combineReducers, legacy_createStore as createStore, applyMiddleware } from 'redux';
import { thunk, ThunkDispatch } from 'redux-thunk';
import { authReducer } from './auth/AuthReducer';
import { chatReducer } from './chat/ChatReducer';
import messageReducer from './message/MessageReducer';
import { callReducer } from './call/CallReducer';

const rootReducer = combineReducers({
    auth: authReducer,
    chat: chatReducer,
    message: messageReducer,
    call: callReducer,
});

export const store = createStore(rootReducer, applyMiddleware(thunk));

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = ThunkDispatch<RootState, void, any>;
