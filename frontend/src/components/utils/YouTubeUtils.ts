// YouTube URL patterns
const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;

export const extractYouTubeVideoId = (url: string): string | null => {
    const match = url.match(YOUTUBE_REGEX);
    return match ? match[1] : null;
};

export const isYouTubeUrl = (text: string): boolean => {
    return YOUTUBE_REGEX.test(text);
};

export const getYouTubeThumbnail = (videoId: string): string => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

export const getYouTubeEmbedUrl = (videoId: string): string => {
    return `https://www.youtube.com/embed/${videoId}`;
};

export const getYouTubeWatchUrl = (videoId: string): string => {
    return `https://www.youtube.com/watch?v=${videoId}`;
};

export const extractYouTubeLinks = (text: string): string[] => {
    const matches = text.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/g);
    return matches || [];
};

