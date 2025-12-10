package com.nicolas.chatapp.service;

import com.nicolas.chatapp.exception.UserException;
import com.nicolas.chatapp.model.Otp;
import com.nicolas.chatapp.model.User;
import com.nicolas.chatapp.repository.OtpRepository;
import com.nicolas.chatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpRepository otpRepository;
    private final UserRepository userRepository;
    private final Random random = new Random();

    public String generateOtp(String phoneNumber) throws UserException {
        // Delete existing OTP for this phone number
        otpRepository.deleteByPhoneNumber(phoneNumber);

        // Generate 6-digit OTP
        String otpCode = String.format("%06d", random.nextInt(1000000));

        // Create and save OTP
        Otp otp = Otp.builder()
                .phoneNumber(phoneNumber)
                .otpCode(otpCode)
                .createdAt(LocalDateTime.now())
                .expiresAt(Otp.calculateExpiry())
                .isVerified(false)
                .attemptCount(0)
                .build();

        otpRepository.save(otp);

        // Send OTP (mock service - replace with real SMS provider)
        sendOtpSms(phoneNumber, otpCode);

        log.info("OTP generated for phone number: {}", phoneNumber);
        return otpCode; // In production, don't return OTP
    }

    public boolean verifyOtp(String phoneNumber, String otpCode) throws UserException {
        Optional<Otp> otpOptional = otpRepository.findByPhoneNumber(phoneNumber);

        if (otpOptional.isEmpty()) {
            throw new UserException("No OTP found for this phone number");
        }

        Otp otp = otpOptional.get();

        // Check if expired
        if (otp.isExpired()) {
            otpRepository.delete(otp);
            throw new UserException("OTP has expired. Please request a new one.");
        }

        // Check max attempts
        if (otp.isMaxAttemptsReached()) {
            otpRepository.delete(otp);
            throw new UserException("Maximum verification attempts reached. Please request a new OTP.");
        }

        // Verify OTP
        otp.incrementAttempt();
        if (otp.getOtpCode().equals(otpCode)) {
            otp.setIsVerified(true);
            otpRepository.save(otp);
            
            // Update user's otpVerified status if user exists
            Optional<User> userOptional = userRepository.findByPhoneNumber(phoneNumber);
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                user.setOtpVerified(true); // Set to true on successful verification
                user.setPhoneNumber(phoneNumber); // Ensure phone number is set
                userRepository.save(user);
                log.info("User {} OTP verified and phone number updated", user.getId());
            }
            
            log.info("OTP verified successfully for phone number: {}", phoneNumber);
            return true;
        } else {
            // Invalid OTP - set otpVerified to false if user exists
            Optional<User> userOptional = userRepository.findByPhoneNumber(phoneNumber);
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                user.setOtpVerified(false); // Set to false on failed verification
                userRepository.save(user);
            }
            otpRepository.save(otp);
            throw new UserException("Invalid OTP code");
        }
    }

    public void resendOtp(String phoneNumber) throws UserException {
        generateOtp(phoneNumber);
    }

    @Transactional
    public void deleteVerifiedOtp(String phoneNumber) {
        otpRepository.deleteByPhoneNumber(phoneNumber);
    }

    @Transactional
    public void updateUserPhoneAndVerification(String userId, String phoneNumber) throws UserException {
        Optional<User> userOptional = userRepository.findById(java.util.UUID.fromString(userId));
        if (userOptional.isEmpty()) {
            throw new UserException("User not found");
        }
        
        User user = userOptional.get();
        
        // Check if phone number is already taken by another user
        Optional<User> existingUserWithPhone = userRepository.findByPhoneNumber(phoneNumber);
        if (existingUserWithPhone.isPresent() && !existingUserWithPhone.get().getId().equals(user.getId())) {
            throw new UserException("Phone number already registered to another user");
        }
        
        user.setPhoneNumber(phoneNumber);
        user.setOtpVerified(true); // Set to true after successful verification
        userRepository.save(user);
        log.info("User {} phone number updated and OTP verified (otpVerified = true)", userId);
    }

    // Mock SMS service - Replace with real provider (Twilio, AWS SNS, etc.)
    private void sendOtpSms(String phoneNumber, String otpCode) {
        // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
        log.info("Sending OTP {} to phone number: {}", otpCode, phoneNumber);
        // Example with Twilio:
        // twilioService.sendSms(phoneNumber, "Your OTP code is: " + otpCode);
    }

    // Clean up expired OTPs every hour
    @Scheduled(fixedRate = 3600000) // 1 hour
    @Transactional
    public void cleanupExpiredOtps() {
        otpRepository.deleteExpiredOtps(LocalDateTime.now());
        log.info("Cleaned up expired OTPs");
    }
}

