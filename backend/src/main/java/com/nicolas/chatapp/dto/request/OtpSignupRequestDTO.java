package com.nicolas.chatapp.dto.request;

public record OtpSignupRequestDTO(String phoneNumber, String otpCode, String fullName) {
}

