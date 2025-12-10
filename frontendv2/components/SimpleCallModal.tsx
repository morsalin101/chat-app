import { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-react';

interface UserDTO {
  id: string;
  fullName: string;
  profilePicture?: string;
  email: string;
}

interface SimpleCallModalProps {
  isIncoming: boolean;
  caller: UserDTO | null;
  callType: 'voice' | 'video';
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  duration: number;
}

export function SimpleCallModal({
  isIncoming,
  caller,
  callType,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  isMuted,
  duration
}: SimpleCallModalProps) {
  
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!caller) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#202c33] rounded-lg p-8 w-full max-w-md">
        {/* User Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-4 bg-[#00a884]">
            {caller.profilePicture ? (
              <img 
                src={caller.profilePicture} 
                alt={caller.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-3xl font-semibold">
                {caller.fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <h2 className="text-white text-2xl font-semibold mb-2">
            {caller.fullName}
          </h2>
          
          {isIncoming ? (
            <p className="text-[#8696a0] text-lg">
              Incoming {callType} call...
            </p>
          ) : duration > 0 ? (
            <p className="text-[#00a884] text-lg font-mono">
              {formatDuration(duration)}
            </p>
          ) : (
            <p className="text-[#8696a0] text-lg">
              Calling...
            </p>
          )}
        </div>

        {/* Call Controls */}
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
              {/* Mute Toggle */}
              <button
                onClick={onToggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isMuted 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-[#3b4a54] hover:bg-[#4a5a64]'
                }`}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <MicOff size={24} className="text-white" />
                ) : (
                  <Mic size={24} className="text-white" />
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
    </div>
  );
}
