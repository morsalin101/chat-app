import { X, Camera, Mail, Phone as PhoneIcon } from 'lucide-react';
import { UserDTO } from '../redux/auth/AuthModel';

interface ProfileProps {
  user: UserDTO | null;
  isOpen: boolean;
  onClose: () => void;
}

export function Profile({ user, isOpen, onClose }: ProfileProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[#111b21] w-full max-w-md h-full md:h-[600px] md:rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#202c33] p-4 flex items-center gap-4">
          <button
            onClick={onClose}
            className="text-[#aebac1] hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <h2 className="text-white text-lg">Profile</h2>
        </div>

        {/* Profile Picture */}
        <div className="relative bg-[#202c33] p-8">
          <div className="w-48 h-48 rounded-full mx-auto overflow-hidden bg-[#2a3942]">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl text-[#667781]">
                {user.fullName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="text-[#00a884] text-sm mb-2 block">Name</label>
            <div className="bg-[#202c33] rounded-lg p-4">
              <p className="text-white">{user.fullName}</p>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-[#00a884] text-sm mb-2 block">Email</label>
            <div className="bg-[#202c33] rounded-lg p-4 flex items-center gap-3">
              <Mail size={20} className="text-[#667781]" />
              <p className="text-white">{user.email}</p>
            </div>
          </div>

          {/* About */}
          {user.email && (
            <div>
              <label className="text-[#00a884] text-sm mb-2 block">About</label>
              <div className="bg-[#202c33] rounded-lg p-4">
                <p className="text-[#667781] text-sm">
                  Hey there! I am using chat app.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
