import authReducer from "./auth/AuthReducer";
import {combineReducers} from "redux";
import {configureStore} from "@reduxjs/toolkit";
import chatReducer from "./chat/ChatReducer";
import messageReducer from "./message/MessageReducer";
import {callReducer} from "./call/CallReducer";

const rootReducer = combineReducers({
    auth: authReducer,
    chat: chatReducer,
    message: messageReducer,
    call: callReducer,
});

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these paths in the state for serializable checks
                ignoredActions: ['call/SET_LOCAL_STREAM', 'call/SET_REMOTE_STREAM'],
                ignoredPaths: ['call.currentCall.localStream', 'call.currentCall.remoteStream'],
            },
            immutableCheck: {
                // Ignore chat.chats path to prevent false positives from nested structures
                ignoredPaths: ['chat.chats'],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
