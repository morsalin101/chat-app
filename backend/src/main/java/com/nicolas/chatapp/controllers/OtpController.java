package com.nicolas.chatapp.controllers;

import com.nicolas.chatapp.dto.request.OtpForUserRequestDTO;
import com.nicolas.chatapp.dto.request.OtpRequestDTO;
import com.nicolas.chatapp.dto.request.VerifyOtpRequestDTO;
import com.nicolas.chatapp.dto.response.ApiResponseDTO;
import com.nicolas.chatapp.dto.response.OtpResponseDTO;
import com.nicolas.chatapp.exception.UserException;
import com.nicolas.chatapp.service.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/otp")
public class OtpController {

    private final OtpService otpService;

    @PostMapping("/generate")
    public ResponseEntity<OtpResponseDTO> generateOtp(@RequestBody OtpRequestDTO request) {
        try {
            otpService.generateOtp(request.phoneNumber());
            OtpResponseDTO response = OtpResponseDTO.builder()
                    .message("OTP sent successfully to " + request.phoneNumber())
                    .success(true)
                    .build();
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (UserException e) {
            log.error("Error generating OTP: {}", e.getMessage());
            OtpResponseDTO response = OtpResponseDTO.builder()
                    .message(e.getMessage())
                    .success(false)
                    .build();
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponseDTO> verifyOtp(@RequestBody VerifyOtpRequestDTO request) {
        try {
            boolean isValid = otpService.verifyOtp(request.phoneNumber(), request.otpCode());
            if (isValid) {
                ApiResponseDTO response = ApiResponseDTO.builder()
                        .message("OTP verified successfully")
                        .status(true)
                        .build();
                return new ResponseEntity<>(response, HttpStatus.OK);
            } else {
                ApiResponseDTO response = ApiResponseDTO.builder()
                        .message("OTP verification failed")
                        .status(false)
                        .build();
                return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
            }
        } catch (UserException e) {
            log.error("Error verifying OTP: {}", e.getMessage());
            ApiResponseDTO response = ApiResponseDTO.builder()
                    .message(e.getMessage())
                    .status(false)
                    .build();
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/verify-for-user")
    public ResponseEntity<ApiResponseDTO> verifyOtpForUser(@RequestBody OtpForUserRequestDTO request) {
        try {
            boolean isValid = otpService.verifyOtp(request.phoneNumber(), request.otpCode());
            if (isValid) {
                // Update user's phone number and otpVerified status
                otpService.updateUserPhoneAndVerification(request.userId(), request.phoneNumber());
                
                ApiResponseDTO response = ApiResponseDTO.builder()
                        .message("OTP verified successfully. Phone number updated.")
                        .status(true)
                        .build();
                return new ResponseEntity<>(response, HttpStatus.OK);
            } else {
                ApiResponseDTO response = ApiResponseDTO.builder()
                        .message("OTP verification failed")
                        .status(false)
                        .build();
                return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
            }
        } catch (UserException e) {
            log.error("Error verifying OTP for user: {}", e.getMessage());
            ApiResponseDTO response = ApiResponseDTO.builder()
                    .message(e.getMessage())
                    .status(false)
                    .build();
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/resend")
    public ResponseEntity<OtpResponseDTO> resendOtp(@RequestBody OtpRequestDTO request) {
        try {
            otpService.resendOtp(request.phoneNumber());
            OtpResponseDTO response = OtpResponseDTO.builder()
                    .message("OTP resent successfully")
                    .success(true)
                    .build();
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (UserException e) {
            log.error("Error resending OTP: {}", e.getMessage());
            OtpResponseDTO response = OtpResponseDTO.builder()
                    .message(e.getMessage())
                    .success(false)
                    .build();
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }
    }
}

