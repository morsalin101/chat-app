import { UserDTO } from '../auth/AuthModel';

export interface ChatDTO {
    id: string;
    chatName: string | null;
    chatImage: string | null;
    isGroup: boolean;
    admins: UserDTO[];
    createdBy: UserDTO;
    users: UserDTO[];
    messages: any[];
    createdAt: string;
}

export interface CreateGroupRequest {
    userIds: string[];
    chatName: string;
    chatImage: string;
}

export interface CreateSingleChatRequest {
    userId: string;
}

export interface ChatState {
    chats: ChatDTO[];
    createdGroup: ChatDTO | null;
    createdChat: ChatDTO | null;
    deletedChat: ChatDTO | null;
    editedGroup: ChatDTO | null;
    markedAsReadChat: ChatDTO | null;
}
