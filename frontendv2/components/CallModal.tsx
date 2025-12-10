import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Phone, PhoneOff, Mic, MicOff, X } from 'lucide-react';
import { RootState, AppDispatch } from '../redux/Store';
import { endCall, acceptCall, rejectCall, updateCallStatus } from '../redux/call/CallAction';
import { WebRTCHandler, CallSignal } from '../utils/WebRTCUtils';

interface CallModalProps {
  stompClient: any;
}

export function CallModal({ stompClient }: CallModalProps) {
  const dispatch: AppDispatch = useDispatch();
  const callState = useSelector((state: RootState) => state.call);
  const authState = useSelector((state: RootState) => state.auth);
  
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const webrtcHandlerRef = useRef<WebRTCHandler | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { currentCall, isCallModalOpen } = callState;
  const otherUser = currentCall.isIncoming ? currentCall.caller : currentCall.receiver;

  // Initialize WebRTC for outgoing call
  useEffect(() => {
    if (currentCall.status === 'ringing' && !currentCall.isIncoming && authState.reqUser && otherUser) {
      startCall();
    }
  }, [currentCall.status, currentCall.isIncoming]);

  // Accept incoming call
  useEffect(() => {
    if (currentCall.status === 'connecting' && currentCall.isIncoming && authState.reqUser && otherUser) {
      acceptIncomingCall();
    }
  }, [currentCall.status, currentCall.isIncoming]);

  // Start call duration timer when connected
  useEffect(() => {
    if (currentCall.status === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setCallDuration(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentCall.status]);

  // WebSocket subscription for call signals
  useEffect(() => {
    if (stompClient && authState.reqUser) {
      const subscription = stompClient.subscribe(
        `/topic/${authState.reqUser.id}/call`,
        (message: any) => {
          try {
            const signal: CallSignal = JSON.parse(message.body);
            handleCallSignal(signal);
          } catch (error) {
            console.error('Error parsing call signal:', error);
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [stompClient, authState.reqUser]);

  const startCall = async () => {
    if (!authState.reqUser || !otherUser) return;

    try {
      const handler = new WebRTCHandler(
        authState.reqUser.id,
        otherUser.id,
        currentCall.callType,
        sendSignal
      );

      const stream = await handler.initializeLocalStream();
      await handler.createPeerConnection();
      await handler.createOffer();

      handler.setOnRemoteStream((remoteStream) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
        }
        dispatch(updateCallStatus('connected'));
      });

      webrtcHandlerRef.current = handler;
    } catch (error) {
      console.error('Error starting call:', error);
      handleEnd();
    }
  };

  const acceptIncomingCall = async () => {
    if (!authState.reqUser || !otherUser) return;

    try {
      const handler = new WebRTCHandler(
        authState.reqUser.id,
        otherUser.id,
        currentCall.callType,
        sendSignal
      );

      const stream = await handler.initializeLocalStream();
      await handler.createPeerConnection();

      handler.setOnRemoteStream((remoteStream) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
        }
        dispatch(updateCallStatus('connected'));
      });

      webrtcHandlerRef.current = handler;

      // Send accepted signal
      sendSignal({
        type: 'accepted',
        from: authState.reqUser.id,
        to: otherUser.id,
      });
    } catch (error) {
      console.error('Error accepting call:', error);
      handleReject();
    }
  };

  const handleCallSignal = async (signal: CallSignal) => {
    if (!webrtcHandlerRef.current) return;

    try {
      switch (signal.type) {
        case 'offer':
          await webrtcHandlerRef.current.handleOffer(signal.offer);
          break;
        case 'answer':
          await webrtcHandlerRef.current.handleAnswer(signal.answer);
          break;
        case 'ice-candidate':
          await webrtcHandlerRef.current.handleICECandidate(signal.candidate);
          break;
        case 'accepted':
          dispatch(updateCallStatus('connecting'));
          break;
        case 'reject':
          handleEnd();
          break;
        case 'end':
          handleEnd();
          break;
      }
    } catch (error) {
      console.error('Error handling call signal:', error);
    }
  };

  const sendSignal = (signal: CallSignal) => {
    if (stompClient && stompClient.connected) {
      stompClient.send('/app/call-signal', {}, JSON.stringify(signal));
    }
  };

  const handleAccept = () => {
    dispatch(acceptCall());
  };

  const handleReject = () => {
    if (otherUser && authState.reqUser) {
      sendSignal({
        type: 'reject',
        from: authState.reqUser.id,
        to: otherUser.id,
      });
    }
    cleanup();
    dispatch(rejectCall());
  };

  const handleEnd = () => {
    if (otherUser && authState.reqUser) {
      sendSignal({
        type: 'end',
        from: authState.reqUser.id,
        to: otherUser.id,
      });
    }
    cleanup();
    dispatch(endCall());
  };

  const toggleMute = () => {
    if (webrtcHandlerRef.current) {
      const enabled = webrtcHandlerRef.current.toggleAudio();
      setIsMuted(!enabled);
    }
  };

  const cleanup = () => {
    if (webrtcHandlerRef.current) {
      webrtcHandlerRef.current.cleanup();
      webrtcHandlerRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCallDuration(0);
    setIsMuted(false);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isCallModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-[#202c33] rounded-lg p-8 max-w-md w-full mx-4">
        {/* Audio element for remote stream */}
        <audio ref={remoteAudioRef} autoPlay playsInline />

        {/* User Info */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden bg-[#2a3942]">
            {otherUser?.profilePicture ? (
              <img
                src={otherUser.profilePicture}
                alt={otherUser.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-[#667781]">
                {otherUser?.fullName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h2 className="text-white text-2xl mb-2">{otherUser?.fullName || 'Unknown'}</h2>
          <p className="text-[#667781]">
            {currentCall.status === 'ringing' && currentCall.isIncoming && 'Incoming call...'}
            {currentCall.status === 'ringing' && !currentCall.isIncoming && 'Calling...'}
            {currentCall.status === 'connecting' && 'Connecting...'}
            {currentCall.status === 'connected' && formatDuration(callDuration)}
          </p>
        </div>

        {/* Call Controls */}
        <div className="flex justify-center gap-4">
          {currentCall.status === 'ringing' && currentCall.isIncoming ? (
            <>
              <button
                onClick={handleAccept}
                className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center transition-colors"
              >
                <Phone size={28} className="text-white" />
              </button>
              <button
                onClick={handleReject}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
              >
                <PhoneOff size={28} className="text-white" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full ${
                  isMuted ? 'bg-red-600' : 'bg-[#2a3942]'
                } hover:opacity-80 flex items-center justify-center transition-colors`}
              >
                {isMuted ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
              </button>
              <button
                onClick={handleEnd}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
              >
                <PhoneOff size={28} className="text-white" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
