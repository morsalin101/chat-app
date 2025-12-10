import { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff } from 'lucide-react';

interface UserDTO {
  id: string;
  fullName: string;
  profilePicture?: string;
  email: string;
}

interface VideoCallModalProps {
  isIncoming: boolean;
  caller: UserDTO | null;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  isMuted: boolean;
  isVideoOff: boolean;
  duration: number;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
}

export function VideoCallModal({
  isIncoming,
  caller,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onToggleVideo,
  isMuted,
  isVideoOff,
  duration,
  localVideoRef,
  remoteVideoRef
}: VideoCallModalProps) {
  
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!caller) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Remote Video (Full Screen) */}
      <div className="flex-1 relative bg-[#1a1a1a]">
        <video 
          ref={remoteVideoRef}
          autoPlay
          className="w-full h-full object-cover"
        />
        
        {/* Header with caller info and duration */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div>
              <h2 className="text-xl font-semibold">{caller.fullName}</h2>
              {isIncoming ? (
                <p className="text-sm text-gray-300">Incoming video call...</p>
              ) : duration > 0 ? (
                <p className="text-sm text-[#00a884] font-mono">{formatDuration(duration)}</p>
              ) : (
                <p className="text-sm text-gray-300">Calling...</p>
              )}
            </div>
          </div>
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-20 right-4 w-40 h-56 bg-[#202c33] rounded-lg overflow-hidden shadow-2xl border-2 border-gray-700">
          <video 
            ref={localVideoRef}
            autoPlay
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
        </div>
      </div>

      {/* Call Controls */}
      <div className="bg-[#202c33] p-6">
        <div className="flex items-center justify-center gap-6">
          {isIncoming ? (
            <>
              {/* Accept Call */}
              <button
                onClick={onAccept}
                className="w-16 h-16 rounded-full bg-[#00a884] hover:bg-[#00a884]/90 flex items-center justify-center transition-all transform hover:scale-110"
                title="Accept"
              >
                <Phone size={28} className="text-white" />
              </button>
              
              {/* Reject Call */}
              <button
                onClick={onReject}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all transform hover:scale-110"
                title="Reject"
              >
                <PhoneOff size={28} className="text-white" />
              </button>
            </>
          ) : (
            <>
              {/* Toggle Mute */}
              <button
                onClick={onToggleMute}
                className={`w-14 h-14 rounded-full ${
                  isMuted ? 'bg-red-500' : 'bg-[#374248]'
                } hover:opacity-90 flex items-center justify-center transition-all`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <MicOff size={24} className="text-white" />
                ) : (
                  <Mic size={24} className="text-white" />
                )}
              </button>

              {/* Toggle Video */}
              <button
                onClick={onToggleVideo}
                className={`w-14 h-14 rounded-full ${
                  isVideoOff ? 'bg-red-500' : 'bg-[#374248]'
                } hover:opacity-90 flex items-center justify-center transition-all`}
                title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
              >
                {isVideoOff ? (
                  <VideoOff size={24} className="text-white" />
                ) : (
                  <VideoIcon size={24} className="text-white" />
                )}
              </button>
              
              {/* End Call */}
              <button
                onClick={onEnd}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all transform hover:scale-110"
                title="End call"
              >
                <PhoneOff size={28} className="text-white" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Floating End Call Button - Always visible */}
      {!isIncoming && (
        <div className="fixed top-6 right-6 z-50">
          <button
            onClick={onEnd}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all transform hover:scale-110 shadow-2xl"
            title="End call"
          >
            <PhoneOff size={24} className="text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
