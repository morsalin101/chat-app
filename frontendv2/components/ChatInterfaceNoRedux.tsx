import React, { useState, useEffect, useRef } from 'react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { SimpleCallModal } from './SimpleCallModal';
import { VideoCallModal } from './VideoCallModal';
import { Profile } from './Profile';
import { CreateSingleChat } from './CreateSingleChat';
import { TOKEN, BASE_API_URL, AUTHORIZATION_PREFIX } from '../config/Config';
import SockJS from 'sockjs-client';
import { Client, over } from 'stompjs';
import { WebRTCHandler, CallSignal } from '../utils/WebRTCUtils';

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
  isCallHistory?: boolean;
  callType?: 'voice' | 'video';
  callStatus?: string;
  callDuration?: number;
  filePath?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  profilePicture?: string;
  bio?: string;
}

interface ChatDTO {
  id: string;
  chatName?: string;
  chatImage?: string;
  isGroup: boolean;
  users: UserDTO[];
  messages?: MessageDTO[];
}

interface MessageDTO {
  id: string;
  content: string;
  timeStamp: string;
  user?: UserDTO;
  filePath?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

export function ChatInterfaceNoRedux() {
  const [currentUser, setCurrentUser] = useState<UserDTO | null>(null);
  const [chats, setChats] = useState<ChatDTO[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [currentChat, setCurrentChat] = useState<ChatDTO | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stompClient, setStompClient] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileUser, setProfileUser] = useState<UserDTO | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  
  // Call state
  const [isCallActive, setIsCallActive] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [callerInfo, setCallerInfo] = useState<UserDTO | null>(null);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const selectedContactRef = useRef<Contact | null>(null);
  const webRTCHandlerRef = useRef<WebRTCHandler | null>(null);
  const stompClientRef = useRef<any>(null);
  const localAudioRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chatsRef = useRef<ChatDTO[]>([]);
  const currentUserRef = useRef<UserDTO | null>(null);
  
  const token = localStorage.getItem(TOKEN);
  
  // Debug: Log call state changes
  useEffect(() => {
    console.log('[State] isIncomingCall changed to:', isIncomingCall);
    console.log('[State] callerInfo:', callerInfo);
    console.log('[State] isCallActive:', isCallActive);
  }, [isIncomingCall, callerInfo, isCallActive]);
  
  // Update refs for closures
  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);
  
  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);
  
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // Load current user
  useEffect(() => {
    if (!token) return;

    fetch(`${BASE_API_URL}/api/users/profile`, {
      headers: {
        'Authorization': `${AUTHORIZATION_PREFIX}${token}`,
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to load user');
        }
        return res.json();
      })
      .then(data => {
        console.log('[Auth] Loaded user:', data);
        setCurrentUser(data);
      })
      .catch(err => {
        console.error('Failed to load user:', err);
        localStorage.removeItem(TOKEN);
        window.location.href = '/signin';
      });
  }, [token]);

  // Load chats function
  const loadChats = async () => {
    if (!token || !currentUser) return;

    try {
      const res = await fetch(`${BASE_API_URL}/api/chats/user`, {
        headers: {
          'Authorization': `${AUTHORIZATION_PREFIX}${token}`,
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to load chats');
      }
      
      const data = await res.json();
      console.log('[Chats] Loaded chats:', data);
      if (Array.isArray(data)) {
        setChats(data);
      } else {
        setChats([]);
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
      setChats([]);
    }
  };

  // Load chats on mount
  useEffect(() => {
    loadChats();
  }, [token, currentUser]);

  // WebSocket connection
  useEffect(() => {
    if (!token || !currentUser?.id) return;

    const sock = new SockJS(`${BASE_API_URL}/ws`);
    const client = over(sock);
    
    client.connect({}, () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
      setStompClient(client);
      
      // Subscribe to messages
      client.subscribe(`/topic/${currentUser.id}`, (message: any) => {
        console.log('[WebSocket] RAW message received from topic');
        console.log('[WebSocket] Message body:', message.body);
        try {
          const receivedMessage: MessageDTO = JSON.parse(message.body);
          console.log('[WebSocket] Parsed message:', receivedMessage);
          console.log('[WebSocket] Selected contact ID from ref:', selectedContactRef.current?.id);
          
          // Reload chats if this is a new chat (message from user not in current chats)
          if (receivedMessage.user?.id !== currentUser.id) {
            const messageFromExistingChat = chatsRef.current.some(chat => 
              chat.users.some(u => u.id === receivedMessage.user?.id)
            );
            
            if (!messageFromExistingChat) {
              console.log('[WebSocket] New chat detected, reloading chats');
              loadChats();
            }
          }
          
          // Add to messages if it's from another user and a chat is selected
          if (selectedContactRef.current && receivedMessage.user?.id !== currentUser.id) {
            console.log('[WebSocket] Adding message to current chat');
            setMessages(prev => {
              const exists = prev.some(m => m.id === receivedMessage.id);
              console.log('[WebSocket] Message exists:', exists);
              if (exists) return prev;
              
              const newMessage = {
                id: receivedMessage.id,
                text: receivedMessage.content,
                timestamp: new Date(receivedMessage.timeStamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                sent: false,
                status: 'delivered' as const,
                filePath: receivedMessage.filePath,
                fileName: receivedMessage.fileName,
                fileType: receivedMessage.fileType,
                fileSize: receivedMessage.fileSize,
              };
              console.log('[WebSocket] Adding new message:', newMessage);
              return [...prev, newMessage];
            });
          } else {
            console.log('[WebSocket] Message not added - no chat selected or message from self');
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      // Subscribe to call signals
      const callTopic = `/topic/${currentUser.id}/call`;
      console.log('[WebSocket] Subscribing to call topic:', callTopic);
      
      client.subscribe(callTopic, (signal: any) => {
        console.log('[WebSocket] === CALL SIGNAL RECEIVED ===');
        console.log('[WebSocket] Raw signal body:', signal.body);
        try {
          const callSignal: CallSignal = JSON.parse(signal.body);
          console.log('[WebSocket] Parsed signal type:', callSignal.type);
          console.log('[WebSocket] Full signal:', callSignal);
          handleCallSignal(callSignal);
        } catch (error) {
          console.error('[WebSocket] Error parsing call signal:', error);
        }
      });
      
      console.log('[WebSocket] Successfully subscribed to call signals');
      stompClientRef.current = client;
    }, (error: any) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    return () => {
      if (client && client.connected) {
        client.disconnect(() => {
          console.log('[WebSocket] Disconnected');
        });
      }
    };
  }, [token, currentUser?.id]); // Removed currentChat and selectedContact from dependencies

  const loadChatMessages = async (chatId: string) => {
    if (!chatId || !token) return;

    console.log('[Messages] Loading messages for chat:', chatId);
    
    try {
      // Load messages first (critical)
      const messagesRes = await fetch(`${BASE_API_URL}/api/messages/chat/${chatId}`, {
        headers: {
          'Authorization': `${AUTHORIZATION_PREFIX}${token}`,
        }
      });
      
      if (!messagesRes.ok) {
        throw new Error('Failed to load messages');
      }
      
      const messagesData: MessageDTO[] = await messagesRes.json();
      console.log('[Messages] Loaded messages:', messagesData);
      
      const convertedMessages: Message[] = Array.isArray(messagesData) ? messagesData.map(msg => ({
        id: msg.id,
        text: msg.content,
        timestamp: new Date(msg.timeStamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        sent: msg.user?.id === currentUser?.id,
        status: 'delivered' as const,
        filePath: msg.filePath,
        fileName: msg.fileName,
        fileType: msg.fileType,
        fileSize: msg.fileSize,
      })) : [];
      
      // Set messages immediately so they show up
      console.log('[Messages] Setting messages:', convertedMessages);
      setMessages(convertedMessages);
      
      // Load call history separately (non-blocking)
      try {
        const callHistoryRes = await fetch(`${BASE_API_URL}/api/call-history/chat/${chatId}`, {
          headers: {
            'Authorization': `${AUTHORIZATION_PREFIX}${token}`,
          }
        });
        
        if (callHistoryRes.ok) {
          const callHistoryData = await callHistoryRes.json();
          console.log('[CallHistory] Loaded call history:', callHistoryData);
          
          if (Array.isArray(callHistoryData) && callHistoryData.length > 0) {
            const callHistoryMessages = callHistoryData.map((call: any) => {
              const isCaller = call.caller?.id === currentUser?.id;
              const durationText = call.duration 
                ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, '0')}` 
                : '0:00';
              
              const statusText = call.callStatus === 'completed' 
                ? `${call.callType === 'video' ? 'Video' : 'Voice'} call (${durationText})`
                : call.callStatus === 'rejected'
                ? 'Call declined'
                : call.callStatus === 'missed'
                ? 'Missed call'
                : 'Call cancelled';
              
              return {
                id: call.id,
                text: statusText,
                timestamp: new Date(call.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                sent: isCaller,
                status: 'delivered' as const,
                isCallHistory: true,
                callType: call.callType,
                callStatus: call.callStatus,
                callDuration: call.duration
              };
            });
            
            // Merge with existing messages
            const allMessages = [...convertedMessages, ...callHistoryMessages];
            console.log('[Messages] Combined messages with call history:', allMessages);
            setMessages(allMessages);
          }
        } else {
          console.log('[CallHistory] Call history not available or empty');
        }
      } catch (callHistoryErr) {
        console.log('[CallHistory] Could not load call history:', callHistoryErr);
        // Don't fail - messages are already loaded
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
      setMessages([]);
    }
  };

  // Load messages when chat is selected
  useEffect(() => {
    if (!selectedContact?.id) return;
    loadChatMessages(selectedContact.id);
  }, [selectedContact?.id, token, currentUser?.id]);

  // Convert chats to contacts
  const contacts: Contact[] = chats.map(chat => {
    const otherUser = chat.users.find(u => u.id !== currentUser?.id);
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

  // Call signal handling
  const sendCallSignal = (signal: CallSignal) => {
    if (!stompClientRef.current || !stompClientRef.current.connected) {
      console.error('[Call] WebSocket not connected');
      return;
    }
    
    const destination = signal.type === 'offer' ? '/app/call/offer' :
                        signal.type === 'answer' ? '/app/call/answer' :
                        signal.type === 'ice-candidate' ? '/app/call/ice-candidate' :
                        signal.type === 'reject' ? '/app/call/reject' :
                        signal.type === 'accepted' ? '/app/call/accepted' :
                        '/app/call/end';
    
    console.log('[Call] Sending signal:', signal.type, 'to destination:', destination);
    console.log('[Call] Signal data:', signal);
    stompClientRef.current.send(destination, {}, JSON.stringify(signal));
    console.log('[Call] Signal sent successfully');
  };

  const handleCallSignal = async (signal: CallSignal) => {
    console.log('[Call] ===============================');
    console.log('[Call] Handling signal:', signal.type);
    console.log('[Call] Signal from:', signal.from, 'to:', signal.to);
    console.log('[Call] Current user:', currentUserRef.current?.id);
    console.log('[Call] Current chats count:', chatsRef.current.length);
    console.log('[Call] Full signal:', JSON.stringify(signal));
    console.log('[Call] ===============================');
    
    try {
      switch (signal.type) {
        case 'offer':
          console.log('[Call] *** INCOMING CALL OFFER ***');
          
          // Type narrowing - signal is CallOffer here
          if (signal.type !== 'offer') break;
          
          // Incoming call - use ref to get latest chats
          const caller = chatsRef.current
            .flatMap(c => c.users)
            .find(u => u.id === signal.from);
          
          console.log('[Call] Caller found:', caller ? caller.fullName : 'NOT FOUND');
          console.log('[Call] All users in chats:', chatsRef.current.flatMap(c => c.users).map(u => `${u.fullName} (${u.id})`));
          
          if (caller) {
            console.log('[Call] *** SHOWING INCOMING CALL POPUP ***');
            console.log('[Call] Caller:', caller.fullName);
            console.log('[Call] Call type:', signal.callType);
            
            setCallerInfo(caller);
            setCallType(signal.callType);
            setIsIncomingCall(true);
            
            console.log('[Call] State updated - isIncomingCall should be true now');
            
            // Store the offer to be processed when user accepts
            // Initialize WebRTC for incoming call
            console.log('[Call] Initializing WebRTC handler...');
            const handler = new WebRTCHandler(
              currentUserRef.current!.id,
              signal.from,
              signal.callType,
              sendCallSignal
            );
            webRTCHandlerRef.current = handler;
            
            // Store offer for later processing
            handler.pendingOffer = signal.offer;
            
            console.log('[Call] Offer stored, waiting for user to accept');
            
            handler.setOnRemoteStream((stream) => {
              console.log('[Call] Remote stream received on receiver side');
              if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = stream;
                remoteAudioRef.current.play().catch(e => console.error('[Call] Error playing remote audio:', e));
              }
            });
          } else {
            console.error('[Call] Could not find caller in chats');
          }
          break;
          
        case 'answer':
          console.log('[Call] *** ANSWER RECEIVED ***');
          // Type narrowing
          if (signal.type !== 'answer') break;
          
          // Call accepted, handle answer
          if (webRTCHandlerRef.current) {
            console.log('[Call] Handling answer...');
            await webRTCHandlerRef.current.handleAnswer(signal.answer);
            console.log('[Call] Answer handled, starting call timer');
            startCallTimer();
          } else {
            console.error('[Call] No WebRTC handler found for answer');
          }
          break;
          
        case 'ice-candidate':
          console.log('[Call] *** ICE CANDIDATE RECEIVED ***');
          // Type narrowing
          if (signal.type !== 'ice-candidate') break;
          
          // Handle ICE candidate
          if (webRTCHandlerRef.current) {
            console.log('[Call] Adding ICE candidate');
            await webRTCHandlerRef.current.handleICECandidate(signal.candidate);
          } else {
            console.warn('[Call] No WebRTC handler found for ICE candidate');
          }
          break;
          
        case 'reject':
          console.log('[Call] *** CALL REJECTED ***');
          // Call rejected by receiver
          // Don't save here, the rejecter already saved it
          endCall(false, 'rejected');
          break;
          
        case 'accepted':
          console.log('[Call] *** CALL ACCEPTED BY REMOTE USER ***');
          // Call accepted notification
          break;
          
        case 'end':
          console.log('[Call] *** CALL ENDED BY REMOTE USER ***');
          // Call ended by remote user
          // Don't save here, the ender already saved it
          endCall(false, 'completed');
          break;
      }
    } catch (error) {
      console.error('[Call] Error handling signal:', error);
    }
  };

  const startCallTimer = () => {
    const startTime = Date.now();
    callTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setCallDuration(elapsed);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setCallDuration(0);
  };

  const saveCallHistory = async (duration: number, status: string, otherUserId: string) => {
    if (!token || !currentUser || !selectedContact) return;
    
    const callHistoryData = {
      callerId: currentUser.id,
      receiverId: otherUserId,
      callType: callType,
      callStatus: status,
      duration: duration > 0 ? duration : null,
      chatId: selectedContact.id
    };
    
    console.log('[CallHistory] Saving call history:', callHistoryData);
    
    try {
      const response = await fetch(`${BASE_API_URL}/api/call-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${AUTHORIZATION_PREFIX}${token}`
        },
        body: JSON.stringify(callHistoryData)
      });
      
      if (response.ok) {
        console.log('[CallHistory] Call history saved successfully');
        // Reload messages to show call history
        if (selectedContact?.id) {
          loadChatMessages(selectedContact.id);
        }
      } else {
        console.error('[CallHistory] Failed to save call history');
      }
    } catch (error) {
      console.error('[CallHistory] Error saving call history:', error);
    }
  };

  const endCall = (saveHistory: boolean = false, callStatus: string = 'completed') => {
    console.log('[Call] Ending call, saveHistory:', saveHistory, 'status:', callStatus);
    
    const finalDuration = callDuration;
    let otherUserId: string | null = null;
    
    // Get other user ID before cleanup
    if (saveHistory && selectedContact) {
      const chat = chats.find(c => c.id === selectedContact.id);
      if (chat && currentUser) {
        const otherUser = chat.users.find(u => u.id !== currentUser.id);
        if (otherUser) {
          otherUserId = otherUser.id;
        }
      }
    }
    
    // Stop WebRTC
    if (webRTCHandlerRef.current) {
      webRTCHandlerRef.current.cleanup();
      webRTCHandlerRef.current = null;
    }
    
    // Stop timer
    stopCallTimer();
    
    // Reset state
    setIsCallActive(false);
    setIsIncomingCall(false);
    setCallerInfo(null);
    setIsMuted(false);
    
    // Clean up audio elements
    if (localAudioRef.current) {
      localAudioRef.current.srcObject = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    
    // Save call history after cleanup
    if (saveHistory && otherUserId) {
      saveCallHistory(finalDuration, callStatus, otherUserId);
    }
  };

  const toggleVideo = () => {
    if (webRTCHandlerRef.current && callType === 'video') {
      const stream = webRTCHandlerRef.current.getLocalStream();
      if (stream) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !videoTrack.enabled;
          setIsVideoOff(!videoTrack.enabled);
        }
      }
    }
  };

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    const chat = chats.find(c => c.id === contact.id);
    setCurrentChat(chat || null);
    setMessages([]); // Clear messages while loading
  };

  const handleSendMessage = (text: string) => {
    if (!selectedContact?.id || !token || !text.trim()) return;

    const messageData = {
      chatId: selectedContact.id,
      content: text,
    };

    console.log('[Messages] Sending message:', messageData);

    fetch(`${BASE_API_URL}/api/messages/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${AUTHORIZATION_PREFIX}${token}`,
      },
      body: JSON.stringify(messageData),
    })
      .then(res => res.json())
      .then((data: MessageDTO) => {
        console.log('[Messages] Message sent:', data);
        
        // Add to messages immediately
        const newMessage: Message = {
          id: data.id,
          text: data.content,
          timestamp: new Date(data.timeStamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          sent: true,
          status: 'delivered',
        };
        
        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, newMessage];
        });
      })
      .catch(err => console.error('Failed to send message:', err));
  };

  const handleFileSelect = async (file: File) => {
    if (!selectedContact || !token) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chatId', selectedContact.id);
      formData.append('content', '');

      const response = await fetch(`${BASE_API_URL}/api/messages/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `${AUTHORIZATION_PREFIX}${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data: MessageDTO = await response.json();
        console.log('[File] File uploaded:', data);
        
        // Add file message to messages
        const newMessage: Message = {
          id: data.id,
          text: data.content || '',
          timestamp: new Date(data.timeStamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          sent: true,
          status: 'delivered',
          filePath: data.filePath,
          fileName: data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize,
        };
        
        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, newMessage];
        });
      } else {
        console.error('[File] Upload failed:', response.statusText);
        alert('Failed to upload file');
      }
    } catch (error) {
      console.error('[File] Upload error:', error);
      alert('Failed to upload file');
    }
  };

  const handleVoiceCall = async () => {
    if (!selectedContact || !currentUser) return;
    
    // Get the actual user ID from the chat
    const chat = chats.find(c => c.id === selectedContact.id);
    if (!chat) return;
    
    const otherUser = chat.users.find(u => u.id !== currentUser.id);
    if (!otherUser) return;
    
    console.log('[Call] Initiating voice call to:', otherUser.fullName, 'userId:', otherUser.id);
    
    try {
      // Initialize WebRTC handler with the actual user ID
      const handler = new WebRTCHandler(
        currentUser.id,
        otherUser.id,
        'voice',
        sendCallSignal
      );
      webRTCHandlerRef.current = handler;
      
      // Get local audio stream
      const localStream = await handler.initializeLocalStream();
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = localStream;
      }
      
      // Create peer connection
      await handler.createPeerConnection();
      
      // Set up remote stream handler
      handler.setOnRemoteStream((stream) => {
        console.log('[Call] Remote stream received');
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current.play().catch(e => console.error('Error playing remote audio:', e));
        }
      });
      
      // Create and send offer
      console.log('[Call] Creating offer...');
      await handler.createOffer();
      console.log('[Call] Offer created and sent');
      
      // Update UI
      setIsCallActive(true);
      setIsIncomingCall(false);
      setCallType('voice');
      
      console.log('[Call] Call initiated successfully');
    } catch (error) {
      console.error('[Call] Error initiating call:', error);
      endCall();
    }
  };

  const handleVideoCall = async () => {
    if (!selectedContact || !currentUser) return;
    
    // Get the actual user ID from the chat
    const chat = chats.find(c => c.id === selectedContact.id);
    if (!chat) return;
    
    const otherUser = chat.users.find(u => u.id !== currentUser.id);
    if (!otherUser) return;
    
    console.log('[Call] Initiating video call to:', otherUser.fullName, 'userId:', otherUser.id);
    
    try {
      // Initialize WebRTC handler with video
      const handler = new WebRTCHandler(
        currentUser.id,
        otherUser.id,
        'video',
        sendCallSignal
      );
      webRTCHandlerRef.current = handler;
      
      // Get local video stream
      const localStream = await handler.initializeLocalStream();
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = localStream;
      }
      
      // Create peer connection
      await handler.createPeerConnection();
      
      // Set up remote stream handler
      handler.setOnRemoteStream((stream) => {
        console.log('[Call] Remote video stream received');
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current.play().catch(e => console.error('Error playing remote video:', e));
        }
      });
      
      // Create and send offer
      console.log('[Call] Creating video offer...');
      await handler.createOffer();
      console.log('[Call] Video offer created and sent');
      
      // Update UI
      setIsCallActive(true);
      setIsIncomingCall(false);
      setCallType('video');
      
      console.log('[Call] Video call initiated successfully');
    } catch (error) {
      console.error('[Call] Error initiating video call:', error);
      endCall();
    }
  };
  
  const handleAcceptCall = async () => {
    console.log('[Call] Accepting call');
    
    try {
      // Send accepted signal
      if (currentUser && callerInfo) {
        const acceptSignal: CallSignal = {
          type: 'accepted',
          from: currentUser.id,
          to: callerInfo.id
        };
        sendCallSignal(acceptSignal);
      }
      
      // Start call UI
      setIsIncomingCall(false);
      setIsCallActive(true);
      
      // Now process the pending offer
      if (webRTCHandlerRef.current) {
        console.log('[Call] Getting local stream...');
        const localStream = await webRTCHandlerRef.current.initializeLocalStream();
        if (localAudioRef.current) {
          localAudioRef.current.srcObject = localStream;
        }
        
        console.log('[Call] Creating peer connection...');
        await webRTCHandlerRef.current.createPeerConnection();
        
        // Handle the stored offer and send answer
        if (webRTCHandlerRef.current.pendingOffer) {
          console.log('[Call] Handling stored offer and sending answer...');
          await webRTCHandlerRef.current.handleOffer(webRTCHandlerRef.current.pendingOffer);
          webRTCHandlerRef.current.pendingOffer = undefined;
          console.log('[Call] Answer sent successfully');
        }
      }
      
      // Start timer
      startCallTimer();
      
    } catch (error) {
      console.error('[Call] Error accepting call:', error);
      endCall();
    }
  };
  
  const handleRejectCall = () => {
    console.log('[Call] Rejecting call');
    
    if (currentUser && callerInfo) {
      const rejectSignal: CallSignal = {
        type: 'reject',
        from: currentUser.id,
        to: callerInfo.id
      };
      sendCallSignal(rejectSignal);
    }
    
    // Save call history with 'rejected' status
    endCall(true, 'rejected');
  };
  
  const handleEndCall = () => {
    console.log('[Call] User ending call');
    
    // Send end signal to other user
    if (currentUser && selectedContact) {
      // Get the actual user ID from the chat
      const chat = chats.find(c => c.id === selectedContact.id);
      if (chat) {
        const otherUser = chat.users.find(u => u.id !== currentUser.id);
        if (otherUser) {
          const endSignal: CallSignal = {
            type: 'end',
            from: currentUser.id,
            to: otherUser.id
          };
          sendCallSignal(endSignal);
        }
      }
    }
    
    // Save call history with 'completed' status
    endCall(true, 'completed');
  };
  
  const toggleMute = () => {
    if (webRTCHandlerRef.current) {
      const stream = webRTCHandlerRef.current.getLocalStream();
      if (stream) {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !audioTrack.enabled;
          setIsMuted(!audioTrack.enabled);
        }
      }
    }
  };

  const handleProfileClick = () => {
    if (selectedContact) {
      const chat = chats.find(c => c.id === selectedContact.id);
      if (chat) {
        const otherUser = chat.users.find(u => u.id !== currentUser?.id);
        if (otherUser) {
          setProfileUser(otherUser);
          setShowProfile(true);
        }
      }
    }
  };

  const handleNewChat = () => {
    setShowNewChat(true);
  };

  const handleChatCreated = () => {
    // Reload chats after creating a new one
    if (token) {
      loadChats();
    }
  };

  return (
    <div className="flex h-screen bg-[#111b21]">
      {/* Hidden audio/video elements for WebRTC */}
      {callType === 'video' ? (
        <>
          <video ref={localAudioRef as any} autoPlay muted className="hidden" />
          <video ref={remoteAudioRef as any} autoPlay className="hidden" />
        </>
      ) : (
        <>
          <audio ref={localAudioRef} autoPlay muted />
          <audio ref={remoteAudioRef} autoPlay />
        </>
      )}
      
      <ConversationList
        contacts={contacts}
        selectedContact={selectedContact}
        onSelectContact={handleContactClick}
        onNewChat={handleNewChat}
      />
      <ChatWindow
        contact={selectedContact}
        messages={messages}
        onSendMessage={handleSendMessage}
        onVoiceCall={handleVoiceCall}
        onVideoCall={handleVideoCall}
        onProfileClick={handleProfileClick}
        onFileSelect={handleFileSelect}
      />
      {showProfile && profileUser && (
        <Profile
          user={profileUser}
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
        />
      )}
      {(() => {
        console.log('[Render] Call modal check - isCallActive:', isCallActive, 'isIncomingCall:', isIncomingCall, 'callType:', callType);
        if (isCallActive || isIncomingCall) {
          const chat = selectedContact ? chats.find(c => c.id === selectedContact.id) : null;
          const otherUser = chat && currentUser ? chat.users.find(u => u.id !== currentUser.id) : null;
          const caller = isIncomingCall ? callerInfo : otherUser || null;
          
          console.log('[Render] Showing call modal - caller:', caller?.fullName, 'callType:', callType);
          
          // Render video call modal for video calls
          if (callType === 'video') {
            return (
              <VideoCallModal
                isIncoming={isIncomingCall}
                caller={caller}
                onAccept={handleAcceptCall}
                onReject={handleRejectCall}
                onEnd={handleEndCall}
                onToggleMute={toggleMute}
                onToggleVideo={toggleVideo}
                isMuted={isMuted}
                isVideoOff={isVideoOff}
                duration={callDuration}
                localVideoRef={localAudioRef as React.RefObject<HTMLVideoElement>}
                remoteVideoRef={remoteAudioRef as React.RefObject<HTMLVideoElement>}
              />
            );
          }
          
          // Render voice call modal for voice calls
          return (
            <SimpleCallModal
              isIncoming={isIncomingCall}
              caller={caller}
              callType={callType}
              onAccept={handleAcceptCall}
              onReject={handleRejectCall}
              onEnd={handleEndCall}
              onToggleMute={toggleMute}
              isMuted={isMuted}
              duration={callDuration}
            />
          );
        }
        return null;
      })()}
      
      {/* New Chat Modal */}
      <CreateSingleChat
        isOpen={showNewChat}
        onClose={() => setShowNewChat(false)}
        onChatCreated={handleChatCreated}
      />
    </div>
  );
}
