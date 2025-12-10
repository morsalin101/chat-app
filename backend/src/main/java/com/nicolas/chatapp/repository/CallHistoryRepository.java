package com.nicolas.chatapp.repository;

import com.nicolas.chatapp.model.CallHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CallHistoryRepository extends JpaRepository<CallHistory, UUID> {

    @Query("SELECT ch FROM CallHistory ch WHERE ch.caller.id = :userId OR ch.receiver.id = :userId ORDER BY ch.createdAt DESC")
    List<CallHistory> findByUser(@Param("userId") UUID userId);

    @Query("SELECT ch FROM CallHistory ch WHERE ch.chat.id = :chatId ORDER BY ch.createdAt DESC")
    List<CallHistory> findByChatId(@Param("chatId") UUID chatId);
}
