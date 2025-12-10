package com.nicolas.chatapp.dto.response;

import lombok.Builder;

@Builder
public record OtpResponseDTO(String message, Boolean success) {
}

