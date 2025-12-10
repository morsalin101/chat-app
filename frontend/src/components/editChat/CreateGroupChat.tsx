import React, {useEffect, useState, useRef} from "react";
import {UserDTO} from "../../redux/auth/AuthModel";
import {AppDispatch, RootState} from "../../redux/Store";
import {useDispatch, useSelector} from "react-redux";
import {TOKEN, BASE_API_URL} from "../../config/Config";
import {AUTHORIZATION_PREFIX} from "../../redux/Constants";
import {searchUser} from "../../redux/auth/AuthAction";
import {Button, IconButton, InputAdornment, TextField, Avatar} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import WestIcon from "@mui/icons-material/West";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import GroupMember from "./GroupMember";
import SearchIcon from "@mui/icons-material/Search";
import {createGroupChat, getUserChats} from "../../redux/chat/ChatAction";
import {UUID} from "node:crypto";
import styles from './CreateGroupChat.module.scss';

interface CreateGroupChatProps {
    setIsShowCreateGroupChat: (isShowCreateGroupChat: boolean) => void;
}


const CreateGroupChat = (props: CreateGroupChatProps) => {

    const authState = useSelector((state: RootState) => state.auth);
    const [groupMember, setGroupMember] = useState<Set<UserDTO>>(new Set());
    const [userQuery, setUserQuery] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [focused, setFocused] = useState<boolean>(false);
    const [groupPicture, setGroupPicture] = useState<File | null>(null);
    const [picturePreview, setPicturePreview] = useState<string>("");
    const [uploading, setUploading] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [createdChatId, setCreatedChatId] = useState<UUID | null>(null);
    const dispatch: AppDispatch = useDispatch();
    const token = localStorage.getItem(TOKEN);

    useEffect(() => {
        setName("New Group Chat")
    }, []);

    useEffect(() => {
        if (token && userQuery.length > 0) {
            dispatch(searchUser(userQuery, token));
        }
    }, [userQuery, token]);

    useEffect(() => {
        if (authState.reqUser) {
            const newGroupMember: Set<UserDTO> = groupMember.add(authState.reqUser);
            setGroupMember(newGroupMember);
        }
    }, [authState.reqUser, groupMember]);

    const onCreate = async () => {
        if (token) {
            const userIds: UUID[] = Array.from(groupMember).map(member => member.id);
            const createAction = createGroupChat({chatName: name, userIds: userIds}, token);
            await dispatch(createAction);
            
            // Get the created chat ID from Redux state or wait for response
            // For now, we'll upload picture after a short delay
            setTimeout(async () => {
                if (groupPicture && token) {
                    await uploadGroupPictureAfterCreate(groupPicture, token);
                }
            }, 1000);
            
            props.setIsShowCreateGroupChat(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                alert('File size should be less than 10MB');
                return;
            }
            setGroupPicture(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPicturePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadGroupPictureAfterCreate = async (file: File, token: string) => {
        setUploading(true);
        try {
            // First get the latest chats to find the newly created group
            await dispatch(getUserChats(token));
            
            // Note: In a real app, you'd get the chat ID from the create response
            // For now, we'll need to handle this differently or add it to the response
        } catch (error) {
            console.error('Error uploading group picture:', error);
        } finally {
            setUploading(false);
        }
    };

    const handlePictureClick = () => {
        fileInputRef.current?.click();
    };

    const onRemoveMember = (member: UserDTO) => {
        const updatedMembers: Set<UserDTO> = new Set(groupMember);
        updatedMembers.delete(member);
        setGroupMember(updatedMembers);
    };

    const onAddMember = (member: UserDTO) => {
        const updatedMembers: Set<UserDTO> = new Set(groupMember);
        updatedMembers.add(member);
        setGroupMember(updatedMembers);
    };

    const handleBack = () => {
        props.setIsShowCreateGroupChat(false);
    };

    const onChangeQuery = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setUserQuery(e.target.value);
    };

    const onChangeName = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setName(e.target.value);
    };

    const onClearQuery = () => {
        setUserQuery("");
    };

    const getSearchEndAdornment = () => {
        return userQuery.length > 0 &&
            <InputAdornment position='end'>
                <IconButton onClick={onClearQuery}>
                    <ClearIcon/>
                </IconButton>
            </InputAdornment>
    };

    return (
        <div className={styles.createGroupChatOuterContainer}>
            <div className={styles.createGroupChatNavContainer}>
                <IconButton onClick={handleBack}>
                    <WestIcon fontSize='medium'/>
                </IconButton>
                <h2>Create New Group Chat</h2>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', padding: '0 1rem'}}>
                <div style={{position: 'relative'}}>
                    <Avatar
                        src={picturePreview}
                        sx={{width: 80, height: 80}}
                    >
                        {name.charAt(0).toUpperCase()}
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
                <TextField
                    id='chatName'
                    type='text'
                    label='Enter name ...'
                    size='small'
                    fullWidth
                    value={name}
                    onChange={onChangeName}
                    sx={{backgroundColor: 'white'}}/>
            </div>
            <p className={styles.createGroupChatText}>User</p>
            <div className={styles.createGroupChatUserContainer}>
                {groupMember.size > 0 && Array.from(groupMember)
                    .map(member =>
                        <GroupMember member={member} onRemoveMember={onRemoveMember} key={member.id}/>)
                }
            </div>
            <div className={styles.createGroupChatTextField}>
                <TextField
                    id='searchUser'
                    type='text'
                    label='Search user to add ...'
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
            <div className={styles.createGroupChatUserContainer}>
                {userQuery.length > 0 && authState.searchUser?.filter(user =>
                    Array.from(groupMember).filter(member => member.id === user.id).length <= 0)
                    .map(user => <GroupMember member={user} onAddMember={onAddMember} key={user.id}/>)}
            </div>
            <div className={styles.createGroupChatButton}>
                <Button variant={"contained"} onClick={onCreate}>Create Group Chat</Button>
            </div>
        </div>
    );
};

export default CreateGroupChat;