import {ChatDTO} from "../../redux/chat/ChatModel";
import {UserDTO} from "../../redux/auth/AuthModel";
import {BASE_API_URL} from "../../config/Config";

export const getInitialsFromName = (name: string): string => {
    const splitName: string[] = name.split(' ');
    return splitName.length > 1 ? `${splitName[0][0]}${splitName[1][0]}` : splitName[0][0];
};

export const transformDateToString = (date: Date): string => {
    const currentDate = new Date();

    if (date.getFullYear() !== currentDate.getFullYear()) {
        return date.getFullYear().toString();
    }

    if (date.getDate() !== currentDate.getDate()) {
        return getDateFormat(date);
    }

    const hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
    const minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
    return hours + ":" + minutes;
};

export const getChatName = (chat: ChatDTO, reqUser: UserDTO | null): string => {
    if (chat.isGroup) {
        return chat.chatName || 'Group Chat';
    }
    if (!chat.users || chat.users.length === 0) {
        return 'Unknown User';
    }
    if (chat.users.length === 1) {
        return chat.users[0]?.fullName || 'Unknown User';
    }
    return chat.users[0]?.id === reqUser?.id ?
        (chat.users[1]?.fullName || 'Unknown User') : 
        (chat.users[0]?.fullName || 'Unknown User');
};

export const getDateFormat = (date: Date): string => {
    const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
    const month = date.getMonth() < 9 ? `0${(date.getMonth() + 1)}` : (date.getMonth() + 1);
    return day + '.' + month + '.' + (date.getFullYear());
};

export const getImageUrl = (imagePath: string | null | undefined): string | undefined => {
    if (!imagePath) return undefined;
    return `${BASE_API_URL}/uploads/${imagePath}`;
};

export const getChatProfilePicture = (chat: ChatDTO, reqUser: UserDTO | null): string | undefined => {
    if (chat.isGroup) {
        return getImageUrl(chat.groupProfilePicture);
    }
    if (!chat.users || chat.users.length === 0) {
        return undefined;
    }
    // For single chat, show the other user's profile picture
    const otherUser = chat.users[0]?.id === reqUser?.id ? chat.users[1] : chat.users[0];
    return getImageUrl(otherUser?.profilePicture);
};