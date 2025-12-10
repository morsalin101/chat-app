import React, {useState, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    TextField,
    Button,
    Box,
    Typography,
    Alert,
    CircularProgress,
    Avatar,
    IconButton
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import {BASE_API_URL, TOKEN} from '../../config/Config';
import styles from './ProfileSetup.module.scss';

const ProfileSetup = () => {
    const [fullName, setFullName] = useState('');
    const [bio, setBio] = useState('');
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [preview, setPreview] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const token = localStorage.getItem(TOKEN);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setError('File size should be less than 10MB');
                return;
            }
            setProfilePicture(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!fullName || fullName.trim().length < 2) {
            setError('Please enter your full name');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Update profile info
            const updateResponse = await fetch(`${BASE_API_URL}/api/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({fullName, bio}),
            });

            if (!updateResponse.ok) {
                throw new Error('Failed to update profile');
            }

            // Upload profile picture if selected
            if (profilePicture) {
                const formData = new FormData();
                formData.append('file', profilePicture);

                const uploadResponse = await fetch(`${BASE_API_URL}/api/profile/picture`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData,
                });

                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload profile picture');
                }
            }

            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box className={styles.container}>
            <Box className={styles.formContainer}>
                <Typography variant="h4" gutterBottom>
                    Complete Your Profile
                </Typography>

                {error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}

                <Box className={styles.avatarContainer}>
                    <Avatar
                        src={preview}
                        sx={{width: 120, height: 120, mb: 2}}
                    >
                        {fullName.charAt(0).toUpperCase()}
                    </Avatar>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{display: 'none'}}
                    />
                    <IconButton
                        color="primary"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <PhotoCameraIcon/>
                    </IconButton>
                </Box>

                <TextField
                    fullWidth
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    margin="normal"
                    required
                    disabled={loading}
                />

                <TextField
                    fullWidth
                    label="Bio (Optional)"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    margin="normal"
                    multiline
                    rows={3}
                    disabled={loading}
                    placeholder="Tell us about yourself..."
                />

                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading || !fullName}
                    sx={{mt: 2}}
                >
                    {loading ? <CircularProgress size={24}/> : 'Save Profile'}
                </Button>

                <Button
                    fullWidth
                    variant="text"
                    onClick={() => navigate('/')}
                    disabled={loading}
                    sx={{mt: 1}}
                >
                    Skip for now
                </Button>
            </Box>
        </Box>
    );
};

export default ProfileSetup;

