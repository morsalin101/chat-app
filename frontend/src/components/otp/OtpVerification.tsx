import React, {useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {TextField, Button, Box, Typography, Alert, CircularProgress} from '@mui/material';
import {BASE_API_URL} from '../../config/Config';
import styles from './OtpRegistration.module.scss';

const OtpVerification = () => {
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('userId');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSendOtp = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }

        if (!userId) {
            setError('User ID is missing. Please sign up again.');
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
                setMessage('OTP sent successfully! Check your phone. OTP field will appear below.');
                setStep('otp'); // This will show the OTP input field
                setOtpCode(''); // Clear any previous OTP
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

        if (!userId) {
            setError('User ID is missing. Please sign up again.');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch(`${BASE_API_URL}/api/otp/verify-for-user`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    phoneNumber,
                    otpCode,
                    userId
                }),
            });

            const data = await response.json();

            if (data.status) {
                setMessage('OTP verified successfully! Redirecting to login...');
                setTimeout(() => {
                    navigate('/signin');
                }, 2000);
            } else {
                setError(data.message || 'OTP verification failed');
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
                    {step === 'phone' && 'Verify Phone Number'}
                    {step === 'otp' && 'Enter OTP Code'}
                </Typography>

                {error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}
                {message && <Alert severity="success" sx={{mb: 2}}>{message}</Alert>}

                {step === 'phone' && (
                    <>
                        <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                            Please verify your phone number to complete registration
                        </Typography>
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
                            disabled={loading || !phoneNumber}
                            sx={{mt: 2}}
                        >
                            {loading ? <CircularProgress size={24}/> : 'Send OTP'}
                        </Button>
                    </>
                )}

                {step === 'otp' && (
                    <>
                        <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                            Enter the 6-digit OTP sent to <strong>{phoneNumber}</strong>
                        </Typography>
                        <TextField
                            fullWidth
                            label="Enter 6-Digit OTP"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            margin="normal"
                            disabled={loading}
                            inputProps={{maxLength: 6, style: {textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem'}}}
                            sx={{
                                '& .MuiOutlinedInput-input': {
                                    textAlign: 'center',
                                    fontSize: '1.5rem',
                                    letterSpacing: '0.5rem',
                                    fontWeight: 'bold'
                                }
                            }}
                            autoFocus
                        />
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleVerifyOtp}
                            disabled={loading || otpCode.length !== 6}
                            sx={{mt: 2}}
                            size="large"
                        >
                            {loading ? <CircularProgress size={24}/> : 'Submit & Verify OTP'}
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
                        <Button
                            fullWidth
                            variant="text"
                            onClick={() => {
                                setStep('phone');
                                setOtpCode('');
                                setError('');
                                setMessage('');
                            }}
                            disabled={loading}
                            sx={{mt: 1}}
                        >
                            Change Phone Number
                        </Button>
                    </>
                )}
            </Box>
        </Box>
    );
};

export default OtpVerification;

