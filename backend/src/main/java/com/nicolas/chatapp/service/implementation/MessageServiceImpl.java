package com.nicolas.chatapp.service.implementation;

import com.nicolas.chatapp.dto.request.SendMessageRequestDTO;
import com.nicolas.chatapp.dto.response.MessageDTO;
import com.nicolas.chatapp.exception.ChatException;
import com.nicolas.chatapp.exception.MessageException;
import com.nicolas.chatapp.exception.UserException;
import com.nicolas.chatapp.model.Chat;
import com.nicolas.chatapp.model.Message;
import com.nicolas.chatapp.model.User;
import com.nicolas.chatapp.repository.MessageRepository;
import com.nicolas.chatapp.service.ChatService;
import com.nicolas.chatapp.service.MessageService;
import com.nicolas.chatapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final UserService userService;
    private final ChatService chatService;
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public Message sendMessage(SendMessageRequestDTO req, UUID userId) throws UserException, ChatException {

        User user = userService.findUserById(userId);
        Chat chat = chatService.findChatById(req.chatId());

        System.out.println("=== SEND MESSAGE CALLED ===");
        System.out.println("User: " + user.getEmail());
        System.out.println("Chat: " + chat.getId());
        
        Message message = Message.builder()
                .chat(chat)
                .user(user)
                .content(req.content())
                .timeStamp(LocalDateTime.now())
                .readBy(new HashSet<>(Set.of(user.getId())))
                .build();

        System.out.println("=== BEFORE SAVE ===");
        chat.getMessages().add(message);
        Message savedMessage = messageRepository.save(message);
        System.out.println("=== AFTER SAVE ===");
        
        System.out.println("=== MESSAGE SAVED, STARTING BROADCAST ===");
        System.out.println("Message ID: " + savedMessage.getId());
        System.out.println("Chat ID: " + chat.getId());
        System.out.println("Number of users in chat: " + chat.getUsers().size());
        
        // Broadcast message to all users in the chat via WebSocket
        try {
            MessageDTO messageDTO = MessageDTO.fromMessage(savedMessage);
            System.out.println("MessageDTO created: " + messageDTO);
            System.out.println("Broadcasting message to " + chat.getUsers().size() + " users");
            
            for (User chatUser : chat.getUsers()) {
                String topic = "/topic/" + chatUser.getId();
                System.out.println("Sending message to topic: " + topic + " for user: " + chatUser.getEmail());
                try {
                    messagingTemplate.convertAndSend(topic, messageDTO);
                    System.out.println("Message sent successfully to: " + topic);
                } catch (Exception sendEx) {
                    // Client might be disconnected - this is normal, just log at debug level
                    System.out.println("Could not send to " + topic + " (client may be disconnected)");
                }
            }
            System.out.println("=== BROADCAST COMPLETED ===");
        } catch (Exception e) {
            System.err.println("ERROR during broadcast: " + e.getMessage());
            e.printStackTrace();
        }
        
        return savedMessage;
    }

    @Override
    public Message sendMessageWithFile(SendMessageRequestDTO req, UUID userId, String filePath, 
                                      String fileName, String fileType, Long fileSize) 
            throws UserException, ChatException {

        User user = userService.findUserById(userId);
        Chat chat = chatService.findChatById(req.chatId());

        Message message = Message.builder()
                .chat(chat)
                .user(user)
                .content(req.content())
                .timeStamp(LocalDateTime.now())
                .readBy(new HashSet<>(Set.of(user.getId())))
                .filePath(filePath)
                .fileName(fileName)
                .fileType(fileType)
                .fileSize(fileSize)
                .build();

        chat.getMessages().add(message);
        Message savedMessage = messageRepository.save(message);
        
        // Broadcast message to all users in the chat via WebSocket
        MessageDTO messageDTO = MessageDTO.fromMessage(savedMessage);
        for (User chatUser : chat.getUsers()) {
            messagingTemplate.convertAndSend("/topic/" + chatUser.getId(), messageDTO);
        }
        
        return savedMessage;
    }

    @Override
    public List<Message> getChatMessages(UUID chatId, User reqUser) throws UserException, ChatException {

        Chat chat = chatService.findChatById(chatId);

        if (!chat.getUsers().contains(reqUser)) {
            throw new UserException("User isn't related to chat " + chatId);
        }

        return messageRepository.findByChat_Id(chat.getId());
    }

    @Override
    public Message findMessageById(UUID messageId) throws MessageException {

        Optional<Message> message = messageRepository.findById(messageId);

        if (message.isPresent()) {
            return message.get();
        }

        throw new MessageException("Message not found " + messageId);
    }

    @Override
    public void deleteMessageById(UUID messageId, User reqUser) throws UserException, MessageException {

        Message message = findMessageById(messageId);

        if (message.getUser().getId().equals(reqUser.getId())) {
            messageRepository.deleteById(messageId);
            return;
        }

        throw new UserException("User is not related to message " + message.getId());
    }

}
