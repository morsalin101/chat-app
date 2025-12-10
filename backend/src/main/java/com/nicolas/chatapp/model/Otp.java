package com.nicolas.chatapp.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity(name = "OTP")
public class Otp {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(unique = true, nullable = false)
    private String phoneNumber;

    @Column(nullable = false)
    private String otpCode;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private Boolean isVerified = false;

    @Column(nullable = false)
    private Integer attemptCount = 0;

    private static final int MAX_ATTEMPTS = 5;
    private static final int EXPIRY_MINUTES = 2;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean isMaxAttemptsReached() {
        return attemptCount >= MAX_ATTEMPTS;
    }

    public void incrementAttempt() {
        this.attemptCount++;
    }

    public static LocalDateTime calculateExpiry() {
        return LocalDateTime.now().plusMinutes(EXPIRY_MINUTES);
    }
}

