package com.nicolas.chatapp.dto.request;

import java.time.LocalDateTime;
import java.util.UUID;

public record OnlineStatusDTO(UUID userId, Boolean isOnline, LocalDateTime lastSeen) {
}

