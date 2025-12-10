package com.nicolas.chatapp.dto.request;

import java.util.UUID;

public record TypingIndicatorDTO(UUID chatId, UUID userId, String userName, Boolean isTyping) {
}

