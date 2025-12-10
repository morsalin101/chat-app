package com.nicolas.chatapp.controllers;

import com.nicolas.chatapp.dto.request.OnlineStatusDTO;
import com.nicolas.chatapp.dto.request.TypingIndicatorDTO;
import com.nicolas.chatapp.model.Message;
import com.nicolas.chatapp.model.User;
import com.nicolas.chatapp.repository.ChatRepository;
import com.nicolas.chatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Controller
@RequiredArgsConstructor
public class RealtimeChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;

    @MessageMapping("/messages")
    public void receiveMessage(@Payload Message message) {
        for (User user : message.getChat().getUsers()) {
            final String destination = "/topic/" + user.getId();
            messagingTemplate.convertAndSend(destination, message);
        }
    }

    @MessageMapping("/typing")
    public void handleTyping(@Payload TypingIndicatorDTO typingIndicator) {
        // Broadcast typing indicator to all users in the chat
        chatRepository.findById(typingIndicator.chatId()).ifPresent(chat -> {
            for (User user : chat.getUsers()) {
                if (!user.getId().equals(typingIndicator.userId())) {
                    final String destination = "/topic/" + user.getId() + "/typing";
                    messagingTemplate.convertAndSend(destination, typingIndicator);
                }
            }
        });
    }

    @MessageMapping("/online")
    public void handleOnlineStatus(@Payload OnlineStatusDTO onlineStatus) {
        // Update user online status in database
        Optional<User> userOptional = userRepository.findById(onlineStatus.userId());
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            user.setIsOnline(onlineStatus.isOnline());
            user.setLastSeen(LocalDateTime.now());
            userRepository.save(user);

            // Broadcast online status to all chats where this user is a member
            chatRepository.findChatByUserId(user.getId()).forEach(chat -> {
                for (User chatUser : chat.getUsers()) {
                    if (!chatUser.getId().equals(user.getId())) {
                        final String destination = "/topic/" + chatUser.getId() + "/online";
                        messagingTemplate.convertAndSend(destination, onlineStatus);
                    }
                }
            });
        }
    }

}
