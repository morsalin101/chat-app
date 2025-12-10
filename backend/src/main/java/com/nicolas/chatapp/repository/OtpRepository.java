package com.nicolas.chatapp.repository;

import com.nicolas.chatapp.model.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<Otp, java.util.UUID> {

    Optional<Otp> findByPhoneNumber(String phoneNumber);

    @Modifying
    @Query("DELETE FROM OTP o WHERE o.expiresAt < ?1")
    void deleteExpiredOtps(LocalDateTime now);

    @Modifying
    @Query("DELETE FROM OTP o WHERE o.phoneNumber = ?1")
    void deleteByPhoneNumber(String phoneNumber);
}

