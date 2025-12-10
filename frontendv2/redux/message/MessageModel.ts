import { UserDTO } from '../auth/AuthModel';
import { ChatDTO } from '../chat/ChatModel';

export interface MessageDTO {
    id: string;
    content: string;
    timeStamp: string;  // Backend uses timeStamp, not timestamp
    user: UserDTO;
    chat?: ChatDTO;
    filePath?: string | null;
    fileName?: string | null;
    fileType?: string | null;
    fileSize?: number | null;
}

export interface SendMessageRequest {
    chatId: string;
    content: string;
}

export interface WebSocketMessageDTO extends MessageDTO {
    chat: ChatDTO;
}

export interface MessageState {
    messages: MessageDTO[];
    newMessage: MessageDTO | null;
}
