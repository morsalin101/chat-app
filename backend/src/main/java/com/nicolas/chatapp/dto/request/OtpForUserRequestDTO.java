package com.nicolas.chatapp.dto.request;

public record OtpForUserRequestDTO(String phoneNumber, String otpCode, String userId) {
}

