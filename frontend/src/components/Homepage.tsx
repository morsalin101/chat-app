import styles from './Homepage.module.scss';
import React, {useEffect, useState} from "react";
import {NavigateFunction, useNavigate} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {AppDispatch, RootState, store} from "../redux/Store";
import {TOKEN, BASE_API_URL} from "../config/Config";
import EditGroupChat from "./editChat/EditGroupChat";
import Profile from "./profile/Profile";
import {Avatar, Divider, IconButton, InputAdornment, Menu, MenuItem, TextField} from "@mui/material";
import ChatIcon from '@mui/icons-material/Chat';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {currentUser, logoutUser} from "../redux/auth/AuthAction";
import SearchIcon from '@mui/icons-material/Search';
import {getUserChats, markChatAsRead} from "../redux/chat/ChatAction";
import {ChatDTO} from "../redux/chat/ChatModel";
import ChatCard from "./chatCard/ChatCard";
import {getInitialsFromName} from "./utils/Utils";
import ClearIcon from '@mui/icons-material/Clear';
import WelcomePage from "./welcomePage/WelcomePage";
import MessagePage from "./messagePage/MessagePage";
import {MessageDTO, WebSocketMessageDTO} from "../redux/message/MessageModel";
import {createMessage, getAllMessages, receiveMessage} from "../redux/message/MessageAction";
import SockJS from 'sockjs-client';
import {Client, over, Subscription} from "stompjs";
import {AUTHORIZATION_PREFIX} from "../redux/Constants";
import CreateGroupChat from "./editChat/CreateGroupChat";
import CreateSingleChat from "./editChat/CreateSingleChat";
import CallModal from "./call/CallModal";
import {receiveCall, endCall} from "../redux/call/CallAction";
import {CallSignal} from "../utils/WebRTCUtils";

const Homepage = () => {

    const authState = useSelector((state: RootState) => state.auth);
    const chatState = useSelector((state: RootState) => state.chat);
    const messageState = useSelector((state: RootState) => state.message);
    const navigate: NavigateFunction = useNavigate();
    const dispatch: AppDispatch = useDispatch();
    const token: string | null = localStorage.getItem(TOKEN);
    const [isShowEditGroupChat, setIsShowEditGroupChat] = useState<boolean>(false);
    const [isShowCreateGroupChat, setIsShowCreateGroupChat] = useState<boolean>(false);
    const [isShowCreateSingleChat, setIsShowCreateSingleChat] = useState<boolean>(false);
    const [isShowProfile, setIsShowProfile] = useState<boolean>(false);
    const [anchor, setAnchor] = useState(null);
    const [initials, setInitials] = useState<string>("");
    const [query, setQuery] = useState<string>("");
    const [focused, setFocused] = useState<boolean>(false);
    const [currentChat, setCurrentChat] = useState<ChatDTO | null>(null);
    const [messages, setMessages] = useState<MessageDTO[]>([]);
    const [newMessage, setNewMessage] = useState<string>("");
    const [stompClient, setStompClient] = useState<Client | undefined>();
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [messageReceived, setMessageReceived] = useState<boolean>(false);
    const [subscribeTry, setSubscribeTry] = useState<number>(1);
    const open = Boolean(anchor);

    useEffect(() => {
        if (token && !authState.reqUser) {
            dispatch(currentUser(token));
        }
    }, [token, dispatch, authState.reqUser, navigate]);

    useEffect(() => {
        if (!token || authState.reqUser === null) {
            navigate("/signin");
        }
    }, [token, navigate, authState.reqUser]);

    useEffect(() => {
        if (authState.reqUser && authState.reqUser.fullName) {
            const letters = getInitialsFromName(authState.reqUser.fullName);
            setInitials(letters);
        }
    }, [authState.reqUser?.fullName]);

    useEffect(() => {
        if (token) {
            dispatch(getUserChats(token));
        }
    }, [chatState.createdChat, chatState.createdGroup, dispatch, token, chatState.deletedChat, chatState.editedGroup, chatState.markedAsReadChat]);

    useEffect(() => {
        setCurrentChat(chatState.editedGroup);
    }, [chatState.editedGroup]);

    useEffect(() => {
        if (currentChat?.id && token) {
            dispatch(getAllMessages(currentChat.id, token));
        }
    }, [currentChat?.id, dispatch, token]);

    useEffect(() => {
        setMessages(messageState.messages);
    }, [messageState.messages]);

    useEffect(() => {
        if (messageState.newMessage && stompClient && currentChat && isConnected) {
            const webSocketMessage: WebSocketMessageDTO = {...messageState.newMessage, chat: currentChat};
            stompClient.send("/app/messages", {}, JSON.stringify(webSocketMessage));
        }
    }, [messageState.newMessage]);

    useEffect(() => {
        console.log("Attempting to subscribe to ws: ", subscribeTry);
        if (isConnected && stompClient && stompClient.connected && authState.reqUser && authState.reqUser.id) {
            const subscription: Subscription = stompClient.subscribe("/topic/" + authState.reqUser.id.toString(), onMessageReceive);
            
            // Subscribe to call signals using topic routing (same pattern as messages)
            const callSubscription: Subscription = stompClient.subscribe("/topic/" + authState.reqUser.id.toString() + "/call", (message) => {
                try {
                    const signal: CallSignal = JSON.parse(message.body);
                    console.log('Raw call signal received from WebSocket:', signal);
                    handleCallSignal(signal);
                } catch (error) {
                    console.error('Error parsing call signal:', error);
                }
            });

            return () => {
                subscription.unsubscribe();
                callSubscription.unsubscribe();
            };
        } else {
            const timeout = setTimeout(() => setSubscribeTry(subscribeTry + 1), 500);
            return () => clearTimeout(timeout);
        }
    }, [subscribeTry, isConnected, stompClient, authState.reqUser]);

    const handleCallSignal = async (signal: CallSignal) => {
        const callState = store.getState().call.currentCall;
        
        console.log('Call signal received:', signal.type, 'Current status:', callState.status);
        
        if (signal.type === 'offer' && callState.status === 'idle') {
            // Incoming call
            const caller = authState.searchUser?.find(u => u.id.toString() === signal.from) || 
                         {id: signal.from, fullName: 'Unknown User', email: ''} as any;
            const receiver = authState.reqUser;
            console.log('Incoming call from:', caller, 'to:', receiver);
            if (receiver) {
                dispatch(receiveCall(signal.callType || 'voice', caller, receiver));
                // Store offer for when call is accepted
                if ((window as any).callSignalHandler) {
                    (window as any).callSignalHandler(signal);
                }
            }
        } else if (signal.type === 'reject' || signal.type === 'end') {
            dispatch(endCall());
        } else {
            // Forward to CallModal via window handler
            if ((window as any).callSignalHandler) {
                (window as any).callSignalHandler(signal);
            }
        }
    };

    useEffect(() => {
        if (messageReceived && currentChat?.id && token) {
            dispatch(markChatAsRead(currentChat.id, token));
            dispatch(getAllMessages(currentChat.id, token));
        }
        if (token) {
            dispatch(getUserChats(token));
        }
        setMessageReceived(false);
    }, [messageReceived]);

    useEffect(() => {
        connect();
    }, []);

    const connect = () => {
        const headers = {
            Authorization: `${AUTHORIZATION_PREFIX}${token}`
        };

        const socket: WebSocket = new SockJS("http://localhost:8080/ws");
        const client: Client = over(socket);
        client.connect(headers, onConnect, onError);
        setStompClient(client);
    };

    const onConnect = async () => {
        setTimeout(() => setIsConnected(true), 1000);
    };

    const onError = (error: any) => {
        console.error("WebSocket connection error", error);
    };

    const onMessageReceive = (payload: any) => {
        try {
            const message = JSON.parse(payload.body);
            console.log('Message received via WebSocket:', message);
            
            // Dispatch to Redux to add message
            dispatch(receiveMessage(message));
            
            // Update chat list to show latest message
            setMessageReceived(true);
        } catch (error) {
            console.error('Error processing received message:', error);
        }
    };

    const onSendMessage = () => {
        if (currentChat?.id && token) {
            dispatch(createMessage({chatId: currentChat.id, content: newMessage}, token));
            setNewMessage("");
        }
    };

    const onOpenProfile = () => {
        onCloseMenu();
        setIsShowProfile(true);
    };

    const onCloseProfile = () => {
        setIsShowProfile(false);
    };

    const onOpenMenu = (e: any) => {
        setAnchor(e.currentTarget);
    };

    const onCloseMenu = () => {
        setAnchor(null);
    };

    const onCreateGroupChat = () => {
        onCloseMenu();
        setIsShowCreateGroupChat(true);
    };

    const onCreateSingleChat = () => {
        setIsShowCreateSingleChat(true);
    };

    const onLogout = () => {
        dispatch(logoutUser());
        navigate("/signin");
    };

    const onChangeQuery = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setQuery(e.target.value.toLowerCase());
    };

    const onClearQuery = () => {
        setQuery("");
    };

    const onClickChat = (chat: ChatDTO) => {
        if (token) {
            dispatch(markChatAsRead(chat.id, token));
        }
        setCurrentChat(chat);
    };

    const getSearchEndAdornment = () => {
        return query.length > 0 &&
            <InputAdornment position='end'>
                <IconButton onClick={onClearQuery}>
                    <ClearIcon/>
                </IconButton>
            </InputAdornment>
    };

    return (
        <div>
            <div className={styles.outerContainer}>
                <div className={styles.innerContainer}>
                    <div className={styles.sideBarContainer}>
                        {isShowCreateSingleChat &&
                            <CreateSingleChat setIsShowCreateSingleChat={setIsShowCreateSingleChat}/>}
                        {isShowCreateGroupChat &&
                            <CreateGroupChat setIsShowCreateGroupChat={setIsShowCreateGroupChat}/>}
                        {isShowEditGroupChat &&
                            <EditGroupChat setIsShowEditGroupChat={setIsShowEditGroupChat} currentChat={currentChat}/>}
                        {isShowProfile &&
                            <div className={styles.profileContainer}>
                                <Profile onCloseProfile={onCloseProfile} initials={initials}/>
                            </div>}
                        <CallModal stompClient={stompClient}/>
                        {!isShowCreateSingleChat && !isShowEditGroupChat && !isShowCreateGroupChat && !isShowProfile &&
                            <div className={styles.sideBarInnerContainer}>
                                <div className={styles.navContainer}>
                                    <div onClick={onOpenProfile} className={styles.userInfoContainer}>
                                        <Avatar 
                                            src={authState.reqUser?.profilePicture ? `${BASE_API_URL}/uploads/${authState.reqUser.profilePicture}` : undefined}
                                            sx={{
                                                width: '2.5rem',
                                                height: '2.5rem',
                                                fontSize: '1rem',
                                                mr: '0.75rem'
                                            }}
                                        >
                                            {initials}
                                        </Avatar>
                                        <p>{authState.reqUser?.fullName}</p>
                                    </div>
                                    <div>
                                        <IconButton onClick={onCreateSingleChat}>
                                            <ChatIcon/>
                                        </IconButton>
                                        <IconButton onClick={onOpenMenu}>
                                            <MoreVertIcon/>
                                        </IconButton>
                                        <Menu
                                            id="basic-menu"
                                            anchorEl={anchor}
                                            open={open}
                                            onClose={onCloseMenu}
                                            MenuListProps={{'aria-labelledby': 'basic-button'}}>
                                            <MenuItem onClick={onOpenProfile}>Profile</MenuItem>
                                            <MenuItem onClick={onCreateGroupChat}>Create Group</MenuItem>
                                            <MenuItem onClick={onLogout}>Logout</MenuItem>
                                        </Menu>
                                    </div>
                                </div>
                                <div className={styles.searchContainer}>
                                    <TextField
                                        id='search'
                                        type='text'
                                        label='Search your chats ...'
                                        size='small'
                                        fullWidth
                                        value={query}
                                        onChange={onChangeQuery}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position='start'>
                                                    <SearchIcon/>
                                                </InputAdornment>
                                            ),
                                            endAdornment: getSearchEndAdornment(),
                                        }}
                                        InputLabelProps={{
                                            shrink: focused || query.length > 0,
                                            style: {marginLeft: focused || query.length > 0 ? 0 : 30}
                                        }}
                                        onFocus={() => setFocused(true)}
                                        onBlur={() => setFocused(false)}/>
                                </div>
                                <div className={styles.chatsContainer}>
                                    {query.length > 0 && chatState.chats?.filter(x =>
                                        x.isGroup ? x.chatName?.toLowerCase().includes(query) || false :
                                            (x.users && x.users.length > 0 && x.users[0]?.id === authState.reqUser?.id ? 
                                                (x.users[1]?.fullName?.toLowerCase().includes(query) || false) :
                                                (x.users && x.users.length > 0 && x.users[0]?.fullName?.toLowerCase().includes(query) || false)))
                                        .map((chat: ChatDTO) => (
                                            <div key={chat.id} onClick={() => onClickChat(chat)}>
                                                <Divider/>
                                                <ChatCard chat={chat}/>
                                            </div>
                                        ))}
                                    {query.length === 0 && chatState.chats?.map((chat: ChatDTO) => (
                                        <div key={chat.id} onClick={() => onClickChat(chat)}>
                                            <Divider/>
                                            <ChatCard chat={chat}/>
                                        </div>
                                    ))}
                                    {chatState.chats?.length > 0 ? <Divider/> : null}
                                </div>
                            </div>}
                    </div>
                    <div className={styles.messagesContainer}>
                        {!currentChat && <WelcomePage reqUser={authState.reqUser}/>}
                        {currentChat && <MessagePage
                            chat={currentChat}
                            reqUser={authState.reqUser}
                            messages={messages}
                            newMessage={newMessage}
                            setNewMessage={setNewMessage}
                            onSendMessage={onSendMessage}
                            setIsShowEditGroupChat={setIsShowEditGroupChat}
                            setCurrentChat={setCurrentChat}/>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Homepage;
