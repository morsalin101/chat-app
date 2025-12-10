package com.nicolas.chatapp.service;

import com.nicolas.chatapp.model.CallHistory;
import com.nicolas.chatapp.model.Chat;
import com.nicolas.chatapp.model.User;
import com.nicolas.chatapp.repository.CallHistoryRepository;
import com.nicolas.chatapp.repository.ChatRepository;
import com.nicolas.chatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CallHistoryService {

    private final CallHistoryRepository callHistoryRepository;
    private final UserRepository userRepository;
    private final ChatRepository chatRepository;

    public CallHistory saveCallHistory(UUID callerId, UUID receiverId, String callType, 
                                       String callStatus, Integer duration, UUID chatId) {
        User caller = userRepository.findById(callerId).orElse(null);
        User receiver = userRepository.findById(receiverId).orElse(null);
        Chat chat = chatId != null ? chatRepository.findById(chatId).orElse(null) : null;

        if (caller == null || receiver == null) {
            log.error("Caller or receiver not found");
            return null;
        }

        CallHistory callHistory = CallHistory.builder()
                .caller(caller)
                .receiver(receiver)
                .callType(callType)
                .callStatus(callStatus)
                .duration(duration)
                .chat(chat)
                .build();

        return callHistoryRepository.save(callHistory);
    }

    public List<CallHistory> getUserCallHistory(UUID userId) {
        return callHistoryRepository.findByUser(userId);
    }

    public List<CallHistory> getChatCallHistory(UUID chatId) {
        return callHistoryRepository.findByChatId(chatId);
    }
}
