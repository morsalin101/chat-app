import React, {useEffect, useRef, useState} from 'react';
import {Box, Dialog, DialogContent, IconButton, Typography, Button} from '@mui/material';
import {useDispatch, useSelector} from 'react-redux';
import {RootState, store} from '../../redux/Store';
import {endCall, acceptCall, rejectCall, updateCallStatus, setLocalStream, setRemoteStream} from '../../redux/call/CallAction';
import {WebRTCHandler, CallSignal} from '../../utils/WebRTCUtils';
import CallEndIcon from '@mui/icons-material/CallEnd';
import PhoneIcon from '@mui/icons-material/Phone';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

const CallModal: React.FC<{stompClient: any}> = ({stompClient}) => {
    const dispatch = useDispatch();
    const callState = useSelector((state: RootState) => state.call.currentCall);
    const authState = useSelector((state: RootState) => state.auth);
    
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null); // For voice call audio
    const webrtcHandlerRef = useRef<WebRTCHandler | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null); // Store stream in ref, not Redux
    const remoteStreamRef = useRef<MediaStream | null>(null); // Store stream in ref, not Redux
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const callSignalRef = useRef<CallSignal | null>(null);
    const pendingICECandidates = useRef<RTCIceCandidateInit[]>([]); // Queue ICE candidates that arrive before peer connection exists
    const ringingStartTimeRef = useRef<number | null>(null);
    const ringingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const canChangeStatusRef = useRef<boolean>(false); // Flag to control status change
    const callStartTimeRef = useRef<number | null>(null); // Track when call connected
    const [callDuration, setCallDuration] = useState<number>(0); // Duration in seconds
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    
    const isVideoCall = callState.callType === 'video';
    const otherUser = callState.isIncoming ? callState.caller : callState.receiver;

    useEffect(() => {
        if (callState.status === 'ringing' && !callState.isIncoming && authState.reqUser) {
            // Outgoing call - record start time
            if (!ringingStartTimeRef.current) {
                ringingStartTimeRef.current = Date.now();
                canChangeStatusRef.current = false; // Block status change initially
            }
            
            // Start call setup only if not already started
            if (!webrtcHandlerRef.current) {
                setTimeout(() => {
                    startCall();
                }, 500);
            }
            
            // Auto-end call after 2 minutes if not answered
            if (!ringingTimeoutRef.current) {
                ringingTimeoutRef.current = setTimeout(() => {
                    const currentState = store.getState().call.currentCall;
                    // If still ringing after 2 minutes, auto-end call
                    if (currentState.status === 'ringing' && !currentState.isIncoming) {
                        handleEnd();
                    } else if (currentState.status === 'ringing' || currentState.status === 'connecting') {
                        // Allow status change if answered
                        canChangeStatusRef.current = true;
                        if (currentState.remoteStream) {
                            dispatch(updateCallStatus('connected'));
                        }
                    }
                }, 120000); // 2 minutes
            }
            
        } else if (callState.status === 'ringing' && callState.isIncoming) {
            // Incoming call - play ringtone
            if (!ringingStartTimeRef.current) {
                ringingStartTimeRef.current = Date.now();
            }
            playRingtone();
            
            // Auto-end incoming call after 2 minutes if not answered
            if (!ringingTimeoutRef.current) {
                ringingTimeoutRef.current = setTimeout(() => {
                    const currentState = store.getState().call.currentCall;
                    // If still ringing after 2 minutes, auto-end call
                    if (currentState.status === 'ringing' && currentState.isIncoming) {
                        handleReject();
                    }
                }, 120000); // 2 minutes
            }
            
        } else if (callState.status === 'connecting' && callState.isIncoming && authState.reqUser) {
            // Accepting incoming call - clear auto-end timeout
            if (ringingTimeoutRef.current) {
                clearTimeout(ringingTimeoutRef.current);
                ringingTimeoutRef.current = null;
            }
            // Only accept if not already started
            if (!webrtcHandlerRef.current) {
                acceptIncomingCall();
            }
        } else if (callState.status === 'connected') {
            stopRingtone();
            // Clear ringing timeout when connected
            if (ringingTimeoutRef.current) {
                clearTimeout(ringingTimeoutRef.current);
                ringingTimeoutRef.current = null;
            }
            ringingStartTimeRef.current = null;
            canChangeStatusRef.current = true;
            
            // Start call timer
            if (!callStartTimeRef.current) {
                callStartTimeRef.current = Date.now();
                timerIntervalRef.current = setInterval(() => {
                    setCallDuration(Math.floor((Date.now() - (callStartTimeRef.current || Date.now())) / 1000));
                }, 1000);
            }
        }

        return () => {
            if (callState.status === 'ended' || callState.status === 'rejected') {
                saveCallHistory();
                cleanup();
            }
        };
    }, [callState.status, callState.isIncoming]);

    // Handle incoming call signals from WebSocket
    useEffect(() => {
        const handler = async (signal: CallSignal) => {
            if (signal.type === 'accepted') {
                // Receiver accepted the call - update caller's status to connecting
                if (!callState.isIncoming && callState.status === 'ringing') {
                    dispatch(updateCallStatus('connecting'));
                    canChangeStatusRef.current = true;
                }
            } else if (webrtcHandlerRef.current) {
                if (signal.type === 'answer') {
                    try {
                        await webrtcHandlerRef.current.handleAnswer(signal.answer);
                        if (callState.status !== 'connected') {
                            dispatch(updateCallStatus('connecting'));
                        }
                    } catch (error) {
                        console.error('Error handling answer:', error);
                    }
                } else if (signal.type === 'ice-candidate') {
                    try {
                        await webrtcHandlerRef.current.handleICECandidate(signal.candidate);
                    } catch (error) {
                        // If peer connection not initialized, queue for later
                        if (error instanceof Error && error.message.includes('Peer connection not initialized')) {
                            console.log('Queueing ICE candidate (peer connection not initialized)');
                            pendingICECandidates.current.push(signal.candidate);
                        } else {
                            console.error('Error handling ICE candidate:', error);
                        }
                    }
                } else if (signal.type === 'offer') {
                    // Handle offer when accepting incoming call
                    if (callState.status === 'connecting' && callState.isIncoming) {
                        try {
                            await webrtcHandlerRef.current.handleOffer(signal.offer);
                        } catch (error) {
                            console.error('Error handling offer:', error);
                        }
                    }
                }
            } else {
                // No peer connection yet - queue signals for later
                if (signal.type === 'offer' && callState.status === 'ringing' && callState.isIncoming) {
                    // Store offer for when call is accepted
                    callSignalRef.current = signal;
                } else if (signal.type === 'ice-candidate') {
                    // Queue ICE candidates that arrive before peer connection exists
                    console.log('Queueing ICE candidate (peer connection not created yet)');
                    pendingICECandidates.current.push(signal.candidate);
                }
            }
        };
        // Store handler for parent to call
        (window as any).callSignalHandler = handler;
    }, [callState.status, callState.isIncoming]);

    // Update video/audio elements when streams change (using refs, not Redux)
    useEffect(() => {
        if (localStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
        }
    }, [callState.status]); // Re-check when call status changes

    useEffect(() => {
        if (remoteStreamRef.current) {
            if (isVideoCall && remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStreamRef.current;
                remoteVideoRef.current.volume = 1.0;
            } else if (!isVideoCall && remoteAudioRef.current) {
                // For voice calls, use audio element
                remoteAudioRef.current.srcObject = remoteStreamRef.current;
                remoteAudioRef.current.volume = 1.0;
            }
        }
    }, [callState.status, isVideoCall]); // Re-check when call status changes

    const startCall = async () => {
        if (!authState.reqUser || !callState.receiver) return;

        try {
            const handler = new WebRTCHandler(
                authState.reqUser.id.toString(),
                callState.receiver.id.toString(),
                callState.callType || 'voice',
                (signal) => sendCallSignal(signal)
            );

            handler.setOnRemoteStream((stream) => {
                // Store in ref instead of Redux to avoid mutation errors
                remoteStreamRef.current = stream;
                
                // Update audio/video element
                if (isVideoCall && remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = stream;
                    remoteVideoRef.current.volume = 1.0;
                } else if (!isVideoCall && remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = stream;
                    remoteAudioRef.current.volume = 1.0;
                }
                
                // For outgoing calls: Keep ringing for 2 minutes, then connect
                // For incoming calls: Connect immediately if user clicked Receive
                const elapsed = ringingStartTimeRef.current ? Date.now() - ringingStartTimeRef.current : 0;
                const minRingingTime = 120000; // 2 minutes
                
                if (!callState.isIncoming) {
                    // Outgoing call - wait for 2 minutes before connecting
                    if (canChangeStatusRef.current || elapsed >= minRingingTime) {
                        dispatch(updateCallStatus('connected'));
                    } else {
                        // Wait for remaining time
                        const remainingTime = minRingingTime - elapsed;
                        setTimeout(() => {
                            canChangeStatusRef.current = true;
                            const currentState = store.getState().call.currentCall;
                            if (currentState.status === 'ringing' || currentState.status === 'connecting') {
                                dispatch(updateCallStatus('connected'));
                            }
                        }, remainingTime);
                    }
                } else {
                    // Incoming call - connect immediately if user accepted
                    const currentState = store.getState().call.currentCall;
                    if (currentState.status === 'connecting') {
                        dispatch(updateCallStatus('connected'));
                    }
                }
            });

            handler.setOnCallEnd(() => {
                dispatch(endCall());
            });

            const localStream = await handler.initializeLocalStream();
            // Store in ref instead of Redux to avoid mutation errors
            localStreamRef.current = localStream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream;
            }
            
            await handler.createPeerConnection();
            await handler.createOffer();

            webrtcHandlerRef.current = handler;
            
            // Process any pending ICE candidates
            if (pendingICECandidates.current.length > 0) {
                console.log('Processing', pendingICECandidates.current.length, 'pending ICE candidates');
                for (const candidate of pendingICECandidates.current) {
                    try {
                        await handler.handleICECandidate(candidate);
                    } catch (error) {
                        console.error('Error processing pending ICE candidate:', error);
                    }
                }
                pendingICECandidates.current = [];
            }
        } catch (error: any) {
            console.error('Error starting call:', error);
            let errorMessage = 'Failed to start call. ';
            if (error.message) {
                errorMessage += error.message;
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'Camera or microphone not found.';
            } else if (error.name === 'NotAllowedError') {
                errorMessage += 'Permission denied. Please allow camera/microphone access.';
            }
            alert(errorMessage);
            dispatch(endCall());
        }
    };

    const acceptIncomingCall = async () => {
        if (!authState.reqUser || !callState.caller) return;

        try {
            const handler = new WebRTCHandler(
                authState.reqUser.id.toString(),
                callState.caller.id.toString(),
                callState.callType || 'voice',
                (signal) => sendCallSignal(signal)
            );

            handler.setOnRemoteStream((stream) => {
                // Store in ref instead of Redux to avoid mutation errors
                remoteStreamRef.current = stream;
                
                // Update audio/video element
                if (isVideoCall && remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = stream;
                    remoteVideoRef.current.volume = 1.0;
                } else if (!isVideoCall && remoteAudioRef.current) {
                    remoteAudioRef.current.srcObject = stream;
                    remoteAudioRef.current.volume = 1.0;
                }
                
                // For incoming calls, only change to connected if user clicked Receive
                // Check current status - only connect if status is 'connecting' (user accepted)
                const currentState = store.getState().call.currentCall;
                if (currentState.status === 'connecting') {
                    dispatch(updateCallStatus('connected'));
                }
                // If still 'ringing', keep ringing state - don't auto-connect
            });

            handler.setOnCallEnd(() => {
                dispatch(endCall());
            });

            const localStream = await handler.initializeLocalStream();
            // Store in ref instead of Redux to avoid mutation errors
            localStreamRef.current = localStream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream;
            }
            
            await handler.createPeerConnection();
            
            // Handle stored offer if available
            if (callSignalRef.current && callSignalRef.current.type === 'offer') {
                await handler.handleOffer(callSignalRef.current.offer);
                callSignalRef.current = null;
            }
            
            // Don't change status here - status will be 'connecting' after user clicks Receive
            // This function is called when status becomes 'connecting' (after handleAccept)

            webrtcHandlerRef.current = handler;
            
            // Process any pending ICE candidates
            if (pendingICECandidates.current.length > 0) {
                console.log('Processing', pendingICECandidates.current.length, 'pending ICE candidates');
                for (const candidate of pendingICECandidates.current) {
                    try {
                        await handler.handleICECandidate(candidate);
                    } catch (error) {
                        console.error('Error processing pending ICE candidate:', error);
                    }
                }
                pendingICECandidates.current = [];
            }
        } catch (error: any) {
            console.error('Error accepting call:', error);
            let errorMessage = 'Failed to accept call. ';
            if (error.message) {
                errorMessage += error.message;
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'Camera or microphone not found.';
            } else if (error.name === 'NotAllowedError') {
                errorMessage += 'Permission denied. Please allow camera/microphone access.';
            }
            alert(errorMessage);
            dispatch(endCall());
        }
    };

    const sendCallSignal = (signal: CallSignal) => {
        if (stompClient && stompClient.connected) {
            // Send to specific endpoint based on signal type
            const endpoint = `/app/call/${signal.type}`;
            console.log('Sending call signal:', signal.type, 'to:', signal.to, 'from:', signal.from);
            stompClient.send(endpoint, {}, JSON.stringify(signal));
        } else {
            console.error('Cannot send call signal - stompClient not connected');
        }
    };

    const handleAccept = () => {
        // Accept call - change to connecting state
        dispatch(acceptCall());
        
        // Notify caller that receiver accepted the call
        if (stompClient && callState.caller) {
            const signal = {
                type: 'accepted',
                from: authState.reqUser?.id.toString(),
                to: callState.caller.id.toString()
            };
            stompClient.send("/app/call/accepted", {}, JSON.stringify(signal));
        }
        // acceptIncomingCall will be called by useEffect when status becomes 'connecting'
    };

    const handleReject = () => {
        if (webrtcHandlerRef.current) {
            webrtcHandlerRef.current.endCall();
        }
        dispatch(rejectCall());
        if (stompClient && callState.caller) {
            const signal = {
                type: 'reject',
                from: authState.reqUser?.id.toString(),
                to: callState.caller.id.toString()
            };
            stompClient.send("/app/call/reject", {}, JSON.stringify(signal));
        }
    };

    const handleEnd = () => {
        // Clear ringing timeout when user manually ends call
        if (ringingTimeoutRef.current) {
            clearTimeout(ringingTimeoutRef.current);
            ringingTimeoutRef.current = null;
        }
        ringingStartTimeRef.current = null;
        canChangeStatusRef.current = false;
        
        // Save call history before ending
        saveCallHistory();
        
        if (webrtcHandlerRef.current) {
            webrtcHandlerRef.current.endCall();
        }
        dispatch(endCall());
    };

    const toggleMute = () => {
        if (webrtcHandlerRef.current) {
            const isEnabled = webrtcHandlerRef.current.toggleMute();
            setIsMuted(!isEnabled);
        }
    };

    const toggleVideo = () => {
        if (webrtcHandlerRef.current) {
            const isEnabled = webrtcHandlerRef.current.toggleVideo();
            setIsVideoOff(!isEnabled);
        }
    };

    const saveCallHistory = async () => {
        if (!authState.reqUser || !authState.signin?.token) return;
        
        const duration = callStartTimeRef.current ? Math.floor((Date.now() - callStartTimeRef.current) / 1000) : 0;
        const callStatus = callState.status === 'connected' ? 'completed' : 
                          callState.status === 'rejected' ? 'rejected' : 
                          callState.isIncoming ? 'missed' : 'cancelled';
        
        const callHistoryData = {
            callerId: callState.caller?.id,
            receiverId: callState.receiver?.id,
            callType: callState.callType,
            callStatus: callStatus,
            duration: duration > 0 ? duration : null,
            chatId: null // Will be set if call is from a chat
        };

        try {
            const response = await fetch('http://localhost:8080/api/call-history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authState.signin.token}`
                },
                body: JSON.stringify(callHistoryData)
            });
            
            if (!response.ok) {
                console.error('Failed to save call history');
            }
        } catch (error) {
            console.error('Error saving call history:', error);
        }
    };

    const cleanup = () => {
        // Clear timer
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        callStartTimeRef.current = null;
        setCallDuration(0);
        
        if (webrtcHandlerRef.current) {
            webrtcHandlerRef.current.endCall();
            webrtcHandlerRef.current = null;
        }
        // Clear pending signals
        pendingICECandidates.current = [];
        callSignalRef.current = null;
        
        // Clear stream refs (not Redux to avoid mutation errors)
        localStreamRef.current = null;
        remoteStreamRef.current = null;
        
        // Clear video/audio elements
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
        }
        
        stopRingtone();
    };

    const playRingtone = () => {
        // Ringtone logic can be added here
    };

    const stopRingtone = () => {
        // Stop ringtone logic
    };

    const isOpen = callState.status !== 'idle';

    return (
        <Dialog 
            open={isOpen} 
            maxWidth={false} 
            fullWidth={isVideoCall}
            PaperProps={{
                sx: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    width: isVideoCall ? '90vw' : '400px',
                    minHeight: isVideoCall ? '90vh' : '300px',
                    height: isVideoCall ? '90vh' : 'auto',
                    maxWidth: isVideoCall ? '90vw' : '400px',
                    maxHeight: isVideoCall ? '90vh' : '600px',
                    display: 'flex',
                    flexDirection: 'column'
                }
            }}
        >
            <DialogContent sx={{
                p: 0, 
                position: 'relative', 
                height: isVideoCall ? '90vh' : 'auto',
                minHeight: isVideoCall ? '90vh' : '300px',
                display: 'flex', 
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {callState.status === 'ringing' && callState.isIncoming && (
                    <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4, height: '100%', justifyContent: 'center'}}>
                        <Typography variant="h5" sx={{mb: 2}}>
                            Incoming {callState.callType === 'video' ? 'Video' : 'Voice'} Call
                        </Typography>
                        <Typography variant="h6" sx={{mb: 4}}>
                            {otherUser?.fullName || otherUser?.email || 'Unknown User'}
                        </Typography>
                        <Box sx={{display: 'flex', gap: 2, flexDirection: 'column', alignItems: 'center'}}>
                            <Typography variant="body2" sx={{mb: 2, color: 'rgba(255,255,255,0.7)'}}>
                                Tap to answer
                            </Typography>
                            <Box sx={{display: 'flex', gap: 2}}>
                                <IconButton 
                                    onClick={handleAccept}
                                    sx={{
                                        backgroundColor: 'green', 
                                        color: 'white', 
                                        width: 60,
                                        height: 60,
                                        '&:hover': {backgroundColor: 'darkgreen'}
                                    }}
                                    title="Receive Call"
                                >
                                    <PhoneIcon fontSize="large"/>
                                </IconButton>
                                <IconButton 
                                    onClick={handleReject}
                                    sx={{
                                        backgroundColor: 'red', 
                                        color: 'white',
                                        width: 60,
                                        height: 60,
                                        '&:hover': {backgroundColor: 'darkred'}
                                    }}
                                    title="End Call"
                                >
                                    <CallEndIcon fontSize="large"/>
                                </IconButton>
                            </Box>
                        </Box>
                    </Box>
                )}

                {callState.status === 'ringing' && !callState.isIncoming && (
                    <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4, height: '100%', justifyContent: 'center'}}>
                        <Typography variant="h5" sx={{mb: 2}}>
                            Calling...
                        </Typography>
                        <Typography variant="h6" sx={{mb: 4}}>
                            {otherUser?.fullName || otherUser?.email || 'Unknown User'}
                        </Typography>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 4}}>
                            <Box sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                backgroundColor: 'green',
                                animation: 'pulse 1.5s ease-in-out infinite',
                                '@keyframes pulse': {
                                    '0%, 100%': { opacity: 1 },
                                    '50%': { opacity: 0.5 }
                                }
                            }} />
                            <Typography variant="body1">Ringing...</Typography>
                        </Box>
                        <Box sx={{display: 'flex', gap: 2}}>
                            <IconButton 
                                onClick={handleEnd}
                                sx={{backgroundColor: 'red', color: 'white', '&:hover': {backgroundColor: 'darkred'}}}
                                title="End Call"
                            >
                                <CallEndIcon/>
                            </IconButton>
                        </Box>
                    </Box>
                )}

                {(callState.status === 'connecting' || callState.status === 'connected') && (
                    <Box sx={{position: 'relative', width: '100%', height: '100%'}}>
                        {isVideoCall && (
                            <>
                                {callState.status === 'connected' && callState.remoteStream ? (
                                    <>
                                        <video
                                            ref={remoteVideoRef}
                                            autoPlay
                                            playsInline
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                        {callState.status === 'connected' && (
                                            <Box sx={{
                                                position: 'absolute',
                                                top: 20,
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                backgroundColor: 'rgba(0,0,0,0.6)',
                                                padding: '8px 16px',
                                                borderRadius: '20px'
                                            }}>
                                                <Typography variant="body1">
                                                    {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                                                </Typography>
                                            </Box>
                                        )}
                                    </>
                                ) : (
                                    <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                                        <VideocamIcon sx={{fontSize: 80, mb: 2}}/>
                                        <Typography variant="h5" sx={{mb: 2}}>
                                            {otherUser?.fullName || otherUser?.email || 'Unknown User'}
                                        </Typography>
                                        <Typography variant="body1">
                                            {callState.status === 'connecting' ? 'Connecting...' : 'Waiting for video...'}
                                        </Typography>
                                    </Box>
                                )}
                                {callState.localStream && (
                                    <Box sx={{
                                        position: 'absolute',
                                        bottom: 20,
                                        right: 20,
                                        width: '200px',
                                        height: '150px',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        border: '2px solid white'
                                    }}>
                                        <video
                                            ref={localVideoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    </Box>
                                )}
                            </>
                        )}

                        {!isVideoCall && (
                            <>
                                <audio
                                    ref={remoteAudioRef}
                                    autoPlay
                                    playsInline
                                    style={{display: 'none'}}
                                />
                                <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4, height: '100%', justifyContent: 'center'}}>
                                    <VolumeUpIcon sx={{fontSize: 80, mb: 2, color: callState.status === 'connected' ? 'green' : 'white'}}/>
                                    <Typography variant="h5" sx={{mb: 2}}>
                                        {otherUser?.fullName || otherUser?.email || 'Unknown User'}
                                    </Typography>
                                    <Typography variant="body1" sx={{mb: 4}}>
                                        {callState.status === 'connecting' ? 'Connecting...' : callState.status === 'connected' ? `${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, '0')}` : 'Ringing...'}
                                    </Typography>
                                </Box>
                            </>
                        )}

                        <Box sx={{
                            position: 'absolute',
                            bottom: 20,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: 2
                        }}>
                            {isVideoCall && (
                                <IconButton 
                                    onClick={toggleVideo}
                                    sx={{backgroundColor: isVideoOff ? 'red' : 'rgba(255,255,255,0.2)', color: 'white'}}
                                >
                                    {isVideoOff ? <VideocamOffIcon/> : <VideocamIcon/>}
                                </IconButton>
                            )}
                            <IconButton 
                                onClick={toggleMute}
                                sx={{backgroundColor: isMuted ? 'red' : 'rgba(255,255,255,0.2)', color: 'white'}}
                            >
                                {isMuted ? <MicOffIcon/> : <MicIcon/>}
                            </IconButton>
                            <IconButton 
                                onClick={handleEnd}
                                sx={{backgroundColor: 'red', color: 'white', '&:hover': {backgroundColor: 'darkred'}}}
                            >
                                <CallEndIcon/>
                            </IconButton>
                        </Box>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default CallModal;

