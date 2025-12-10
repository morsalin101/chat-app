import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { CallModal } from './CallModal';
import { Profile } from './Profile';
import { RootState, AppDispatch } from '../redux/Store';
import { getUserChats } from '../redux/chat/ChatAction';
import { getAllMessages, createMessage, receiveMessage, clearMessages } from '../redux/message/MessageAction';
import { currentUser } from '../redux/auth/AuthAction';
import { initiateCall, incomingCall } from '../redux/call/CallAction';
import { TOKEN, BASE_API_URL } from '../config/Config';
import { UserDTO } from '../redux/auth/AuthModel';
import SockJS from 'sockjs-client';
import { Client, over } from 'stompjs';

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread?: number;
  online?: boolean;
}

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  sent: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

export function ChatInterface() {
  const dispatch: AppDispatch = useDispatch();
  const authState = useSelector((state: RootState) => state.auth);
  const chatState = useSelector((state: RootState) => state.chat);
  const messageState = useSelector((state: RootState) => state.message);
  
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [stompClient, setStompClient] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileUser, setProfileUser] = useState<UserDTO | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const token = localStorage.getItem(TOKEN);

  // Initialize user and chats
  useEffect(() => {
    if (token && !authState.reqUser) {
      dispatch(currentUser(token));
      dispatch(getUserChats(token));
    }
  }, [token, dispatch]);

  // WebSocket connection - only connect after user is loaded
  useEffect(() => {
    if (!token || !authState.reqUser?.id) {
      return;
    }
    const sock = new SockJS(`${BASE_API_URL}/ws`);
    const client = over(sock);
    
      client.connect({}, () => {
      setIsConnected(true);
      setStompClient(client);
      
      // Subscribe to user's message topic
      client.subscribe(`/topic/${authState.reqUser.id}`, (message: any) => {
        try {
          const receivedMessage = JSON.parse(message.body);
          console.log('[WebSocket] Message received:', receivedMessage);
          dispatch(receiveMessage(receivedMessage));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
    }, (error: any) => {
      console.error('WebSocket connection error:', error);
    });    return () => {
      if (client?.connected) {
        client.disconnect(() => {});
      }
    };
  }, [token, authState.reqUser?.id, dispatch]);

  // Convert chats to contacts
  const contacts: Contact[] = (chatState.chats || []).map(chat => {
    const otherUser = chat.users.find(u => u.id !== authState.reqUser?.id);
    const lastMsg = chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
    
    return {
      id: chat.id,
      name: chat.isGroup ? chat.chatName || 'Group' : otherUser?.fullName || 'Unknown',
      avatar: chat.chatImage || otherUser?.profilePicture || `https://i.pravatar.cc/150?u=${chat.id}`,
      lastMessage: lastMsg?.content || 'No messages yet',
      timestamp: lastMsg ? new Date(lastMsg.timeStamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
      online: false,
    };
  });



  // Update local messages when Redux state changes
  useEffect(() => {
    console.log('[ChatInterface] useEffect triggered');
    console.log('[ChatInterface] authState.reqUser:', authState.reqUser);
    console.log('[ChatInterface] messageState:', messageState);
    console.log('[ChatInterface] messageState.messages count:', messageState.messages?.length || 0);
    console.log('[ChatInterface] messageState.messages:', messageState.messages);
    
    if (!authState.reqUser?.id) {
      console.log('[ChatInterface] No user loaded, clearing messages');
      setMessages([]);
      return;
    }

    const convertedMessages = (messageState.messages || []).map(msg => {
      const isSent = msg.user?.id === authState.reqUser?.id;
      console.log('[ChatInterface] Converting message:', {
        msgId: msg.id.substring(0, 8),
        msgUserId: msg.user?.id?.substring(0, 8),
        reqUserId: authState.reqUser?.id?.substring(0, 8),
        isSent,
        content: msg.content
      });
      return {
        id: msg.id,
        text: msg.content,
        timestamp: new Date(msg.timeStamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        sent: isSent,
        status: 'delivered' as const,
      };
    });

    console.log('[ChatInterface] Setting messages, count:', convertedMessages.length);
    setMessages(convertedMessages);
  }, [messageState.messages, authState.reqUser?.id, messageState]);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedContact?.id && token) {
      dispatch(clearMessages()); // Clear old messages first
      dispatch(getAllMessages(selectedContact.id, token));
    }
  }, [selectedContact?.id, token, dispatch]);

  const handleSendMessage = async (text: string) => {
    if (!selectedContact || !token) return;

    await dispatch(createMessage({ chatId: selectedContact.id, content: text }, token));
  };

  const handleVoiceCall = () => {
    if (!selectedContact) return;
    
    // Find the user from the chat
    const chat = chatState.chats.find(c => c.id === selectedContact.id);
    if (!chat) return;
    
    const otherUser = chat.users.find(u => u.id !== authState.reqUser?.id);
    if (otherUser) {
      dispatch(initiateCall(otherUser, 'voice'));
    }
  };

  const handleProfileClick = () => {
    if (!selectedContact) return;
    
    const chat = chatState.chats.find(c => c.id === selectedContact.id);
    if (!chat) return;
    
    const otherUser = chat.users.find(u => u.id !== authState.reqUser?.id);
    if (otherUser) {
      setProfileUser(otherUser);
      setShowProfile(true);
    }
  };

  return (
    <div className="flex h-full">
      <ConversationList
        contacts={contacts}
        selectedContact={selectedContact}
        onSelectContact={setSelectedContact}
      />
      <ChatWindow
        contact={selectedContact}
        messages={messages}
        onSendMessage={handleSendMessage}
        onVoiceCall={handleVoiceCall}
        onProfileClick={handleProfileClick}
      />
      <CallModal stompClient={stompClient} />
      <Profile
        user={profileUser}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </div>
  );
}
