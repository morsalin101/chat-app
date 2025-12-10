import React, {useState, useEffect} from 'react';
import {Box, Card, CardMedia, CardContent, Typography, IconButton} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import {getYouTubeThumbnail, getYouTubeWatchUrl, extractYouTubeVideoId} from '../utils/YouTubeUtils';

interface YouTubePreviewProps {
    url: string;
    onClose?: () => void;
}

const YouTubePreview: React.FC<YouTubePreviewProps> = ({url, onClose}) => {
    const [videoInfo, setVideoInfo] = useState<{title: string; channel: string} | null>(null);
    const [loading, setLoading] = useState(true);
    const videoId = extractYouTubeVideoId(url);

    useEffect(() => {
        if (!videoId) return;

        // Fetch video info using YouTube oEmbed API
        const fetchVideoInfo = async () => {
            try {
                const response = await fetch(
                    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
                );
                if (response.ok) {
                    const data = await response.json();
                    setVideoInfo({
                        title: data.title,
                        channel: data.author_name
                    });
                }
            } catch (error) {
                console.error('Failed to fetch YouTube video info:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchVideoInfo();
    }, [videoId]);

    if (!videoId) return null;

    const thumbnailUrl = getYouTubeThumbnail(videoId);
    const watchUrl = getYouTubeWatchUrl(videoId);

    const handleClick = () => {
        window.open(watchUrl, '_blank');
    };

    return (
        <Card 
            sx={{ 
                maxWidth: 400, 
                mb: 1, 
                cursor: 'pointer',
                '&:hover': {
                    boxShadow: 4
                }
            }}
            onClick={handleClick}
        >
            <Box sx={{position: 'relative'}}>
                <CardMedia
                    component="img"
                    height="200"
                    image={thumbnailUrl}
                    alt="YouTube thumbnail"
                    sx={{objectFit: 'cover'}}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'rgba(255, 0, 0, 0.8)',
                        borderRadius: '50%',
                        width: 60,
                        height: 60,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <PlayArrowIcon sx={{color: 'white', fontSize: 40}}/>
                </Box>
            </Box>
            <CardContent sx={{pb: 1.5}}>
                {loading ? (
                    <Typography variant="body2" color="text.secondary">
                        Loading...
                    </Typography>
                ) : (
                    <>
                        <Typography variant="subtitle2" component="div" sx={{fontWeight: 'bold', mb: 0.5}}>
                            {videoInfo?.title || 'YouTube Video'}
                        </Typography>
                        {videoInfo?.channel && (
                            <Typography variant="caption" color="text.secondary">
                                {videoInfo.channel}
                            </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 0.5}}>
                            YouTube
                        </Typography>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default YouTubePreview;

