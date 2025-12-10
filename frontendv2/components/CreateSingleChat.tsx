import { useState, useEffect } from 'react';
import { X, Search, User as UserIcon } from 'lucide-react';
import { BASE_API_URL, AUTHORIZATION_PREFIX, TOKEN } from '../config/Config';

interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  profilePicture?: string;
  bio?: string;
}

interface CreateSingleChatProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: () => void;
}

export function CreateSingleChat({ isOpen, onClose, onChatCreated }: CreateSingleChatProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserDTO[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const token = localStorage.getItem(TOKEN);

  // Search users when query changes
  useEffect(() => {
    if (searchQuery.length > 0 && token) {
      const searchUsers = async () => {
        try {
          const response = await fetch(`${BASE_API_URL}/api/users/search?name=${encodeURIComponent(searchQuery)}`, {
            headers: {
              'Authorization': `${AUTHORIZATION_PREFIX}${token}`,
            }
          });
          
          if (response.ok) {
            const data: UserDTO[] = await response.json();
            setSearchResults(data);
          }
        } catch (error) {
          console.error('[CreateChat] Search failed:', error);
        }
      };
      
      const debounce = setTimeout(searchUsers, 300);
      return () => clearTimeout(debounce);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, token]);

  const handleCreateChat = async () => {
    if (!selectedUser || !token) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_API_URL}/api/chats/single`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${AUTHORIZATION_PREFIX}${token}`,
        },
        body: JSON.stringify(selectedUser.id),
      });

      if (response.ok) {
        console.log('[CreateChat] Chat created successfully');
        onChatCreated();
        handleClose();
      } else {
        console.error('[CreateChat] Failed to create chat');
        alert('Failed to create chat');
      }
    } catch (error) {
      console.error('[CreateChat] Error creating chat:', error);
      alert('Failed to create chat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#202c33] rounded-lg w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-[#2a3942] p-4 flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold">New Chat</h2>
          <button
            onClick={handleClose}
            className="text-[#aebac1] hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Selected User */}
        {selectedUser && (
          <div className="p-4 border-b border-[#2a3942]">
            <p className="text-[#8696a0] text-sm mb-2">Selected user:</p>
            <div className="flex items-center gap-3 bg-[#2a3942] p-3 rounded-lg">
              <img
                src={selectedUser.profilePicture || `https://i.pravatar.cc/150?u=${selectedUser.id}`}
                alt={selectedUser.fullName}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1">
                <p className="text-white font-medium">{selectedUser.fullName}</p>
                <p className="text-[#8696a0] text-sm">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-[#aebac1] hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8696a0]" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#2a3942] text-white pl-10 pr-4 py-3 rounded-lg outline-none placeholder:text-[#8696a0]"
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {searchQuery.length > 0 && searchResults.length === 0 && (
            <div className="p-8 text-center text-[#8696a0]">
              <UserIcon size={48} className="mx-auto mb-2 opacity-20" />
              <p>No users found</p>
            </div>
          )}
          
          {searchResults.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="w-full p-4 flex items-center gap-3 hover:bg-[#2a3942] transition-colors border-b border-[#2a3942] last:border-b-0"
            >
              <img
                src={user.profilePicture || `https://i.pravatar.cc/150?u=${user.id}`}
                alt={user.fullName}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1 text-left">
                <p className="text-white font-medium">{user.fullName}</p>
                <p className="text-[#8696a0] text-sm">{user.email}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Create Button */}
        <div className="p-4 border-t border-[#2a3942]">
          <button
            onClick={handleCreateChat}
            disabled={!selectedUser || isLoading}
            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
              selectedUser && !isLoading
                ? 'bg-[#00a884] hover:bg-[#00a884]/90 text-white'
                : 'bg-[#2a3942] text-[#8696a0] cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Creating...' : 'Create Chat'}
          </button>
        </div>
      </div>
    </div>
  );
}
