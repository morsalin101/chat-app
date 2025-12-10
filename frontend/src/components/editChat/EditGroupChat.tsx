import React, {useEffect, useState, useRef} from "react";
import {AppDispatch, RootState} from "../../redux/Store";
import {useDispatch, useSelector} from "react-redux";
import {TOKEN, BASE_API_URL} from "../../config/Config";
import {AUTHORIZATION_PREFIX} from "../../redux/Constants";
import {UserDTO} from "../../redux/auth/AuthModel";
import {searchUser} from "../../redux/auth/AuthAction";
import {IconButton, InputAdornment, TextField, Avatar} from "@mui/material";
import WestIcon from "@mui/icons-material/West";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import styles from './EditGroupChat.module.scss';
import GroupMember from "./GroupMember";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import {ChatDTO} from "../../redux/chat/ChatModel";
import {addUserToGroupChat, removeUserFromGroupChat, uploadGroupPicture, getUserChats} from "../../redux/chat/ChatAction";

interface CreateGroupProps {
    setIsShowEditGroupChat: (showCreateGroup: boolean) => void;
    currentChat: ChatDTO | null;
}

const EditGroupChat = (props: CreateGroupProps) => {

    const authState = useSelector((state: RootState) => state.auth);
    const [userQuery, setUserQuery] = useState<string>("");
    const [focused, setFocused] = useState<boolean>(false);
    const [uploading, setUploading] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dispatch: AppDispatch = useDispatch();
    const token = localStorage.getItem(TOKEN);

    useEffect(() => {
        if (token && userQuery.length > 0) {
            dispatch(searchUser(userQuery, token));
        }
    }, [userQuery, token]);

    const onRemoveMember = (user: UserDTO) => {
        if (token && props.currentChat) {
            dispatch(removeUserFromGroupChat(props.currentChat.id, user.id, token));
        }
    };

    const onAddMember = (user: UserDTO) => {
        if (token && props.currentChat) {
            dispatch(addUserToGroupChat(props.currentChat.id, user.id, token));
        }
    };

    const handleBack = () => {
        props.setIsShowEditGroupChat(false);
    };

    const onChangeQuery = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setUserQuery(e.target.value);
    };

    const onClearQuery = () => {
        setUserQuery("");
    }

    const getSearchEndAdornment = () => {
        return userQuery.length > 0 &&
            <InputAdornment position='end'>
                <IconButton onClick={onClearQuery}>
                    <ClearIcon/>
                </IconButton>
            </InputAdornment>
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token || !props.currentChat) return;

        if (file.size > 10 * 1024 * 1024) {
            alert('File size should be less than 10MB');
            return;
        }

        setUploading(true);
        try {
            await dispatch(uploadGroupPicture(props.currentChat.id, file, token));
            await dispatch(getUserChats(token));
            alert('Group picture uploaded successfully');
        } catch (error) {
            alert('Failed to upload group picture');
        } finally {
            setUploading(false);
        }
    };

    const handlePictureClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={styles.outerEditGroupChatContainer}>
            <div className={styles.editGroupChatNavContainer}>
                <IconButton onClick={handleBack}>
                    <WestIcon fontSize='medium'/>
                </IconButton>
                <h2>Edit Group Chat</h2>
            </div>
            {props.currentChat?.isGroup && (
                <div style={{display: 'flex', justifyContent: 'center', marginBottom: '1rem'}}>
                    <div style={{position: 'relative'}}>
                        <Avatar
                            src={props.currentChat.groupProfilePicture ? `${BASE_API_URL}/uploads/${props.currentChat.groupProfilePicture}` : undefined}
                            sx={{width: 100, height: 100}}
                        >
                            {props.currentChat.chatName?.charAt(0).toUpperCase()}
                        </Avatar>
                        <IconButton
                            onClick={handlePictureClick}
                            disabled={uploading}
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                backgroundColor: 'primary.main',
                                color: 'white',
                                '&:hover': {backgroundColor: 'primary.dark'}
                            }}
                        >
                            <PhotoCameraIcon fontSize="small"/>
                        </IconButton>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{display: 'none'}}
                        />
                    </div>
                </div>
            )}
            <div>
                <div className={styles.editGroupChatTextContainer}>
                    <p className={styles.editGroupChatText}>Remove user</p>
                </div>
                <div className={styles.editGroupChatUserContainer}>
                    {props.currentChat?.users.map(user =>
                        <GroupMember member={user} onRemoveMember={onRemoveMember} key={user.id}/>)
                    }
                </div>
                <div className={styles.editGroupChatTextContainer}>
                    <p className={styles.editGroupChatText}>Add user</p>
                </div>
                <div className={styles.editGroupChatTextField}>
                    <TextField
                        id='searchUser'
                        type='text'
                        label='Search user ...'
                        size='small'
                        fullWidth
                        value={userQuery}
                        onChange={onChangeQuery}
                        sx={{backgroundColor: 'white'}}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <SearchIcon/>
                                </InputAdornment>
                            ),
                            endAdornment: getSearchEndAdornment(),
                        }}
                        InputLabelProps={{
                            shrink: focused || userQuery.length > 0,
                            style: {marginLeft: focused || userQuery.length > 0 ? 0 : 30}
                        }}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}/>
                </div>
            </div>
            <div className={styles.editGroupChatUserContainer}>
                {userQuery.length > 0 && authState.searchUser?.filter(user => {
                    const existingUser = props.currentChat?.users.find(existingUser => existingUser.id === user.id);
                    return existingUser === undefined;
                })
                    .map(user => <GroupMember member={user} onAddMember={onAddMember} key={user.id}/>)}
            </div>
        </div>
    );
};

export default EditGroupChat;