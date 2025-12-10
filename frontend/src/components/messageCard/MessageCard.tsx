import {MessageDTO} from "../../redux/message/MessageModel";
import {UserDTO} from "../../redux/auth/AuthModel";
import styles from './MessageCard.module.scss';
import {Chip, Button, Box} from "@mui/material";
import React from "react";
import {getDateFormat} from "../utils/Utils";
import {BASE_API_URL} from "../../config/Config";
import {TOKEN} from "../../config/Config";
import {downloadFile} from "../../redux/message/MessageAction";
import DownloadIcon from '@mui/icons-material/Download';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import {isYouTubeUrl, extractYouTubeLinks} from "../utils/YouTubeUtils";
import YouTubePreview from "../youtube/YouTubePreview";

interface MessageCardProps {
    message: MessageDTO;
    reqUser: UserDTO | null;
    isNewDate: boolean;
    isGroup: boolean;
}

const MessageCard = (props: MessageCardProps) => {

    const isOwnMessage = props.message.user.id === props.reqUser?.id;
    const date: Date = new Date(props.message.timeStamp);
    const hours = date.getHours() > 9 ? date.getHours().toString() : "0" + date.getHours();
    const minutes = date.getMinutes() > 9 ? date.getMinutes().toString() : "0" + date.getMinutes();
    
    const hasFile = props.message.filePath && props.message.fileName;
    const isImage = props.message.fileType?.startsWith('image/');
    const isPdf = props.message.fileType === 'application/pdf';
    const fileUrl = hasFile ? `${BASE_API_URL}/uploads/${props.message.filePath}` : null;
    
    // Check for YouTube links
    const content = props.message.content || '';
    const youtubeLinks = extractYouTubeLinks(content);
    const hasYouTubeLink = youtubeLinks.length > 0;
    
    const formatFileSize = (bytes?: number): string => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleDownload = async () => {
        const token = localStorage.getItem(TOKEN);
        if (token && props.message.id && props.message.fileName) {
            await downloadFile(props.message.id, props.message.fileName, token);
        }
    };

    const getFileIcon = () => {
        if (isImage) return <ImageIcon sx={{mr: 1}}/>;
        if (isPdf) return <PictureAsPdfIcon sx={{mr: 1}}/>;
        return <DescriptionIcon sx={{mr: 1}}/>;
    };

    // Render content with clickable links
    const renderContent = (text: string) => {
        if (!text) return null;
        
        // Split text by YouTube links
        const parts: (string | JSX.Element)[] = [];
        let lastIndex = 0;
        
        youtubeLinks.forEach((link, index) => {
            const linkIndex = text.indexOf(link, lastIndex);
            if (linkIndex > lastIndex) {
                parts.push(text.substring(lastIndex, linkIndex));
            }
            parts.push(
                <a 
                    key={`link-${index}`}
                    href={link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{color: '#1976d2', textDecoration: 'underline'}}
                >
                    {link}
                </a>
            );
            lastIndex = linkIndex + link.length;
        });
        
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }
        
        return parts.length > 0 ? <>{parts}</> : text;
    };

    const label: React.ReactElement = (
        <div className={styles.bubbleContainer}>
            {props.isGroup && !isOwnMessage && <h4 className={styles.contentContainer}>{props.message.user.fullName}:</h4>}
            
            {hasYouTubeLink && (
                <Box sx={{mb: 1}}>
                    {youtubeLinks.map((link, index) => (
                        <YouTubePreview key={`youtube-${index}`} url={link} />
                    ))}
                </Box>
            )}
            
            {hasFile && (
                <Box sx={{mb: 1, p: 1, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 1}}>
                    {isImage && fileUrl ? (
                        <Box>
                            <img 
                                src={fileUrl} 
                                alt={props.message.fileName}
                                style={{maxWidth: '300px', maxHeight: '300px', borderRadius: '8px', marginBottom: '8px'}}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                            <Button 
                                size="small" 
                                startIcon={<DownloadIcon/>} 
                                onClick={handleDownload}
                                variant="outlined"
                            >
                                {props.message.fileName} ({formatFileSize(props.message.fileSize)})
                            </Button>
                        </Box>
                    ) : (
                        <Button 
                            size="small" 
                            startIcon={getFileIcon()} 
                            onClick={handleDownload}
                            variant="outlined"
                            fullWidth
                        >
                            {props.message.fileName} ({formatFileSize(props.message.fileSize)})
                        </Button>
                    )}
                </Box>
            )}
            
            {props.message.content && (
                <p className={styles.contentContainer}>{renderContent(props.message.content)}</p>
            )}
            <p className={styles.timeContainer}>{hours + ":" + minutes}</p>
        </div>
    );

    const dateLabel: React.ReactElement = (
      <p>{getDateFormat(date)}</p>
    );

    return (
        <div className={styles.messageCardInnerContainer}>
            {props.isNewDate && <div className={styles.date}>{<Chip label={dateLabel}
                                                                    sx={{height: 'auto', width: 'auto', backgroundColor: '#faebd7'}}/>}</div>}
            <div className={isOwnMessage ? styles.ownMessage : styles.othersMessage}>
                <Chip label={label}
                      sx={{height: 'auto', width: 'auto', backgroundColor: isOwnMessage ? '#d3fdd3' : 'white', ml: '0.75rem'}}/>
            </div>
        </div>
    );
};

export default MessageCard;