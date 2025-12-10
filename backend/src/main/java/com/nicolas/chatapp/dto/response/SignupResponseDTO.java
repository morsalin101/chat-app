package com.nicolas.chatapp.dto.response;

import lombok.Builder;

import java.util.UUID;

@Builder
public record SignupResponseDTO(String token, Boolean isAuthenticated, UUID userId, Boolean requiresOtpVerification) {
}

