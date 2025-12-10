import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {TextField, Button, Box, Typography, Alert, CircularProgress} from '@mui/material';
import {BASE_API_URL, TOKEN} from '../../config/Config';
import styles from './OtpRegistration.module.scss';

const OtpRegistration = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [fullName, setFullName] = useState('');
    const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSendOtp = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch(`${BASE_API_URL}/api/otp/generate`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({phoneNumber}),
            });

            const data = await response.json();

            if (data.success) {
                setMessage('OTP sent successfully! Check your phone.');
                setStep('otp');
            } else {
                setError(data.message || 'Failed to send OTP');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpCode || otpCode.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            // First verify OTP
            const verifyResponse = await fetch(`${BASE_API_URL}/api/otp/verify`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({phoneNumber, otpCode}),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyData.status) {
                setError(verifyData.message || 'Invalid OTP');
                setLoading(false);
                return;
            }

            // Check if user exists (login) or new (signup)
            const loginResponse = await fetch(`${BASE_API_URL}/auth/login/otp`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({phoneNumber, otpCode, fullName: ''}),
            });

            if (loginResponse.ok) {
                const loginData = await loginResponse.json();
                localStorage.setItem(TOKEN, loginData.token);
                if (loginData.refreshToken) {
                    localStorage.setItem('refreshToken', loginData.refreshToken);
                }

                if (loginData.isProfileComplete) {
                    navigate('/');
                } else {
                    setStep('profile');
                }
            } else {
                // User doesn't exist, proceed to signup
                setStep('profile');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async () => {
        if (!fullName || fullName.trim().length < 2) {
            setError('Please enter your full name');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${BASE_API_URL}/auth/signup/otp`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({phoneNumber, otpCode, fullName}),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem(TOKEN, data.token);
                if (data.refreshToken) {
                    localStorage.setItem('refreshToken', data.refreshToken);
                }

                if (data.isProfileComplete) {
                    navigate('/');
                } else {
                    navigate('/profile-setup');
                }
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Signup failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch(`${BASE_API_URL}/api/otp/resend`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({phoneNumber}),
            });

            const data = await response.json();

            if (data.success) {
                setMessage('OTP resent successfully!');
            } else {
                setError(data.message || 'Failed to resend OTP');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box className={styles.container}>
            <Box className={styles.formContainer}>
                <Typography variant="h4" gutterBottom>
                    {step === 'phone' && 'Enter Phone Number'}
                    {step === 'otp' && 'Verify OTP'}
                    {step === 'profile' && 'Complete Your Profile'}
                </Typography>

                {error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}
                {message && <Alert severity="success" sx={{mb: 2}}>{message}</Alert>}

                {step === 'phone' && (
                    <>
                        <TextField
                            fullWidth
                            label="Phone Number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+1234567890"
                            margin="normal"
                            disabled={loading}
                        />
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleSendOtp}
                            disabled={loading}
                            sx={{mt: 2}}
                        >
                            {loading ? <CircularProgress size={24}/> : 'Send OTP'}
                        </Button>
                    </>
                )}

                {step === 'otp' && (
                    <>
                        <TextField
                            fullWidth
                            label="OTP Code"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            margin="normal"
                            disabled={loading}
                            inputProps={{maxLength: 6}}
                        />
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleVerifyOtp}
                            disabled={loading}
                            sx={{mt: 2}}
                        >
                            {loading ? <CircularProgress size={24}/> : 'Verify OTP'}
                        </Button>
                        <Button
                            fullWidth
                            variant="text"
                            onClick={handleResendOtp}
                            disabled={loading}
                            sx={{mt: 1}}
                        >
                            Resend OTP
                        </Button>
                    </>
                )}

                {step === 'profile' && (
                    <>
                        <TextField
                            fullWidth
                            label="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            margin="normal"
                            disabled={loading}
                        />
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleSignup}
                            disabled={loading}
                            sx={{mt: 2}}
                        >
                            {loading ? <CircularProgress size={24}/> : 'Complete Signup'}
                        </Button>
                    </>
                )}
            </Box>
        </Box>
    );
};

export default OtpRegistration;

