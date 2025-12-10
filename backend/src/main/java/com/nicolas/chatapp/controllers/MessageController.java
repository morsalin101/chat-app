package com.nicolas.chatapp.controllers;

import com.nicolas.chatapp.config.JwtConstants;
import com.nicolas.chatapp.dto.request.SendMessageRequestDTO;
import com.nicolas.chatapp.dto.response.ApiResponseDTO;
import com.nicolas.chatapp.dto.response.MessageDTO;
import com.nicolas.chatapp.exception.ChatException;
import com.nicolas.chatapp.exception.MessageException;
import com.nicolas.chatapp.exception.UserException;
import com.nicolas.chatapp.model.Message;
import com.nicolas.chatapp.model.User;
import com.nicolas.chatapp.service.MessageService;
import com.nicolas.chatapp.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/messages")
public class MessageController {

    private final UserService userService;
    private final MessageService messageService;
    private final com.nicolas.chatapp.service.FileStorageService fileStorageService;

    @PostMapping("/create")
    public ResponseEntity<MessageDTO> sendMessage(@RequestBody SendMessageRequestDTO req,
                                                  @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt)
            throws ChatException, UserException {

        User user = userService.findUserByProfile(jwt);
        Message message = messageService.sendMessage(req, user.getId());
        log.info("User {} sent message: {}", user.getEmail(), message.getId());

        return new ResponseEntity<>(MessageDTO.fromMessage(message), HttpStatus.OK);
    }

    @GetMapping("/chat/{chatId}")
    public ResponseEntity<List<MessageDTO>> getChatMessages(@PathVariable UUID chatId,
                                                         @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt)
            throws ChatException, UserException {

        User user = userService.findUserByProfile(jwt);
        List<Message> messages = messageService.getChatMessages(chatId, user);

        return new ResponseEntity<>(MessageDTO.fromMessages(messages), HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponseDTO> deleteMessage(@PathVariable UUID id,
                                                        @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt)
            throws UserException, MessageException {

        User user = userService.findUserByProfile(jwt);
        messageService.deleteMessageById(id, user);
        log.info("User {} deleted message: {}", user.getEmail(), id);

        ApiResponseDTO res = ApiResponseDTO.builder()
                .message("Message deleted successfully")
                .status(true)
                .build();

        return new ResponseEntity<>(res, HttpStatus.OK);
    }

    @PostMapping("/upload")
    public ResponseEntity<MessageDTO> uploadFileMessage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("chatId") UUID chatId,
            @RequestParam(value = "content", required = false) String content,
            @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt)
            throws ChatException, UserException, IOException {

        User user = userService.findUserByProfile(jwt);
        
        // Validate file size (max 50MB)
        if (file.getSize() > 50 * 1024 * 1024) {
            throw new RuntimeException("File size exceeds 50MB limit");
        }

        // Save file
        String filePath = fileStorageService.storeFile(file, "messages");
        
        // Create message with file attachment
        com.nicolas.chatapp.dto.request.SendMessageRequestDTO request = 
            new com.nicolas.chatapp.dto.request.SendMessageRequestDTO(chatId, content != null ? content : "");
        
        Message message = messageService.sendMessageWithFile(request, user.getId(), filePath, 
                file.getOriginalFilename(), file.getContentType(), file.getSize());
        
        log.info("User {} sent file message: {}", user.getEmail(), message.getId());

        return new ResponseEntity<>(MessageDTO.fromMessage(message), HttpStatus.OK);
    }

    @GetMapping("/download/{messageId}")
    public ResponseEntity<Resource> downloadFile(@PathVariable UUID messageId,
                                                 @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt)
            throws UserException, MessageException, IOException {

        User user = userService.findUserByProfile(jwt);
        Message message = messageService.findMessageById(messageId);
        
        // Check if user has access to this message (is part of the chat)
        if (!message.getChat().getUsers().contains(user)) {
            throw new RuntimeException("Access denied to this file");
        }

        if (message.getFilePath() == null || message.getFilePath().isEmpty()) {
            throw new RuntimeException("File not found for this message");
        }

        // Load file
        Path filePath = fileStorageService.loadFile(message.getFilePath());
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            throw new RuntimeException("File not found or not readable");
        }

        // Determine content type
        String contentType = message.getFileType();
        if (contentType == null || contentType.isEmpty()) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                        "attachment; filename=\"" + (message.getFileName() != null ? message.getFileName() : "file") + "\"")
                .body(resource);
    }

}
