import { useState } from 'react';
import { Search, MoreVertical, MessageSquare, LogOut } from 'lucide-react';
import type { Contact } from './ChatInterface';
import { TOKEN } from '../config/Config';

interface ConversationListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  onNewChat?: () => void;
}

export function ConversationList({ contacts, selectedContact, onSelectContact, onNewChat }: ConversationListProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem(TOKEN);
    window.location.href = '/';
  };

  return (
    <div className="w-full md:w-[400px] bg-[#111b21] border-r border-[#2a3942] flex flex-col h-full">
      {/* Header */}
      <div className="bg-[#202c33] p-4 flex items-center justify-between">
        <h1 className="text-white text-xl">Chats</h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={onNewChat}
            className="text-[#aebac1] hover:text-white transition-colors"
            title="New chat"
          >
            <MessageSquare size={20} />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-[#aebac1] hover:text-white transition-colors"
            >
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-[#233138] rounded-md shadow-lg z-20">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left text-white hover:bg-[#2a3942] transition-colors flex items-center gap-3 rounded-md"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-2 bg-[#111b21]">
        <div className="bg-[#202c33] rounded-lg px-4 py-2 flex items-center gap-3">
          <Search size={18} className="text-[#aebac1]" />
          <input
            type="text"
            placeholder="Search or start new chat"
            className="bg-transparent text-white placeholder:text-[#667781] outline-none w-full text-sm"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {contacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => onSelectContact(contact)}
            className={`w-full p-4 flex items-center gap-4 hover:bg-[#202c33] transition-colors border-b border-[#2a3942] ${
              selectedContact?.id === contact.id ? 'bg-[#2a3942]' : ''
            }`}
          >
            <div className="relative flex-shrink-0">
              <img
                src={contact.avatar}
                alt={contact.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              {contact.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00d95f] rounded-full border-2 border-[#111b21]" />
              )}
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-white truncate">{contact.name}</h3>
                <span className="text-xs text-[#667781] flex-shrink-0 ml-2">
                  {contact.timestamp}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#667781] truncate">{contact.lastMessage}</p>
                {contact.unread && contact.unread > 0 && (
                  <span className="ml-2 bg-[#00a884] text-[#111b21] text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {contact.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
