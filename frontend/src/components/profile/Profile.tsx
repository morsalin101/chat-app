import React, {Dispatch, useEffect, useState, useRef} from "react";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "../../redux/Store";
import {AuthReducerState, UpdateUserRequestDTO} from "../../redux/auth/AuthModel";
import {TOKEN, BASE_API_URL} from "../../config/Config";
import {AUTHORIZATION_PREFIX} from "../../redux/Constants";
import {currentUser, updateUser} from "../../redux/auth/AuthAction";
import WestIcon from '@mui/icons-material/West';
import {Avatar, IconButton, TextField} from "@mui/material";
import CreateIcon from '@mui/icons-material/Create';
import CheckIcon from '@mui/icons-material/Check';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import styles from './Profile.module.scss';
import CloseIcon from '@mui/icons-material/Close';


interface ProfileProps {
    onCloseProfile: () => void;
    initials: string;
}

const Profile = (props: ProfileProps) => {

    const [isEditName, setIsEditName] = useState<boolean>(false);
    const [fullName, setFullName] = useState<string | null>(null);
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dispatch: Dispatch<any> = useDispatch();
    const auth: AuthReducerState = useSelector((state: RootState) => state.auth);
    const token: string | null = localStorage.getItem(TOKEN);

    useEffect(() => {
        if (auth.reqUser) {
            setFullName(auth.reqUser.fullName);
            // Update profile picture from user data
            const picturePath = auth.reqUser.profilePicture;
            console.log('Profile picture path from user:', picturePath);
            setProfilePicture(picturePath || null);
        }
    }, [auth.reqUser]);

    useEffect(() => {
        if (token && auth.updateUser) {
            dispatch(currentUser(token));
        }
    }, [auth.updateUser, token, dispatch]);

    // Refresh profile picture when user data updates
    useEffect(() => {
        if (auth.reqUser?.profilePicture) {
            setProfilePicture(auth.reqUser.profilePicture);
        }
    }, [auth.reqUser?.profilePicture]);

    const onEditName = () => {
        setIsEditName(true);
    };

    const onUpdateUser = () => {
        if (fullName && token) {
            const data: UpdateUserRequestDTO = {
                fullName: fullName,
            };
            setFullName(fullName);
            dispatch(updateUser(data, token));
            setIsEditName(false);
        }
    };

    const onCancelUpdate = () => {
        if (auth.reqUser) {
            setFullName(auth.reqUser?.fullName);
        }
        setIsEditName(false);
    };

    const onChangeFullName = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setFullName(e.target.value);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;

        if (file.size > 10 * 1024 * 1024) {
            alert('File size should be less than 10MB');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${BASE_API_URL}/api/profile/picture`, {
                method: 'POST',
                headers: {
                    'Authorization': `${AUTHORIZATION_PREFIX}${token}`
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Upload response:', data);
                
                // Immediately refresh user data to get updated profile picture
                dispatch(currentUser(token));
                
                // Force state update after a short delay to ensure data is fetched
                setTimeout(() => {
                    dispatch(currentUser(token));
                }, 500);
                
                alert('Profile picture uploaded successfully');
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Failed to upload profile picture');
            }
        } catch (error) {
            alert('Error uploading profile picture');
        } finally {
            setUploading(false);
        }
    };

    const handlePictureClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={styles.outerContainer}>
            <div className={styles.headingContainer}>
                <IconButton onClick={props.onCloseProfile}>
                    <WestIcon fontSize='medium'/>
                </IconButton>
                <h2>Profile</h2>
            </div>
            <div className={styles.avatarContainer}>
                <div style={{position: 'relative', display: 'inline-block'}}>
                    <Avatar 
                        src={profilePicture ? `${BASE_API_URL}/uploads/${profilePicture}` : undefined}
                        sx={{width: '12vw', height: '12vw', fontSize: '5vw'}}
                        key={profilePicture || 'no-picture'} // Force re-render when picture changes
                        onError={(e) => {
                            console.error('Failed to load profile picture:', profilePicture);
                            console.error('Full URL:', `${BASE_API_URL}/uploads/${profilePicture}`);
                        }}
                        onLoad={() => {
                            console.log('Profile picture loaded successfully:', profilePicture);
                        }}
                    >
                        {props.initials}
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
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{display: 'none'}}
                />
            </div>
            <div className={styles.nameContainer}>
                {!isEditName &&
                    <div className={styles.innerNameStaticContainer}>
                        <p className={styles.nameDistance}>{auth.reqUser?.fullName}</p>
                        <IconButton sx={{mr: '0.75rem'}} onClick={onEditName}>
                            <CreateIcon/>
                        </IconButton>
                    </div>}
                {isEditName &&
                    <div className={styles.innerNameDynamicContainer}>
                        <TextField
                            id="fullName"
                            type="text"
                            label="Enter your full name"
                            variant="outlined"
                            onChange={onChangeFullName}
                            value={fullName}
                            sx={{ml: '0.75rem', width: '70%'}}/>
                        <div>
                            <IconButton onClick={onCancelUpdate}>
                                <CloseIcon/>
                            </IconButton>
                            <IconButton sx={{mr: '0.75rem'}} onClick={onUpdateUser}>
                                <CheckIcon/>
                            </IconButton>
                        </div>
                    </div>}
            </div>
            <div className={styles.infoContainer}>
                <p className={styles.infoText}>This name will appear on your messages</p>
            </div>
        </div>
    );
};

export default Profile;