package com.nicolas.chatapp.controllers;

import com.nicolas.chatapp.model.CallHistory;
import com.nicolas.chatapp.service.CallHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller to handle WebRTC signaling for voice/video calls
 * Routes call offers, answers, ICE candidates and call control signals between users
 */
@Slf4j
@Controller
@RestController
@RequiredArgsConstructor
@CrossOrigin
public class CallSignalingController {
    
    private final SimpMessagingTemplate messagingTemplate;
    private final CallHistoryService callHistoryService;

    /**
     * Handle WebRTC call offer from caller
     * Routes the offer (SDP) to the recipient
     */
    @MessageMapping("/call/offer")
    public void handleCallOffer(@Payload Map<String, Object> message) {
        try {
            String to = (String) message.get("to");
            String from = (String) message.get("from");
            
            log.info("Call offer from {} to {}", from, to);
            
            // Forward the offer to the recipient using topic (same as messages)
            final String destination = "/topic/" + to + "/call";
            log.info("Forwarding offer to destination: {}", destination);
            messagingTemplate.convertAndSend(destination, message);
            log.info("Offer forwarded successfully");
        } catch (Exception e) {
            log.error("Error handling call offer", e);
        }
    }

    /**
     * Handle WebRTC call answer from recipient
     * Routes the answer (SDP) back to the caller
     */
    @MessageMapping("/call/answer")
    public void handleCallAnswer(@Payload Map<String, Object> message) {
        try {
            String to = (String) message.get("to");
            String from = (String) message.get("from");
            
            log.info("Call answer from {} to {}", from, to);
            
            // Forward the answer to the caller using topic
            final String destination = "/topic/" + to + "/call";
            messagingTemplate.convertAndSend(destination, message);
        } catch (Exception e) {
            log.error("Error handling call answer", e);
        }
    }

    /**
     * Handle ICE candidate exchange for NAT traversal
     * Routes ICE candidates between peers
     */
    @MessageMapping("/call/ice-candidate")
    public void handleIceCandidate(@Payload Map<String, Object> message) {
        try {
            String to = (String) message.get("to");
            String from = (String) message.get("from");
            
            log.debug("ICE candidate from {} to {}", from, to);
            
            // Forward ICE candidate to the other peer using topic
            final String destination = "/topic/" + to + "/call";
            messagingTemplate.convertAndSend(destination, message);
        } catch (Exception e) {
            log.error("Error handling ICE candidate", e);
        }
    }

    /**
     * Handle call rejection from recipient
     * Notifies caller that the call was rejected
     */
    @MessageMapping("/call/reject")
    public void handleCallReject(@Payload Map<String, Object> message) {
        try {
            String to = (String) message.get("to");
            String from = (String) message.get("from");
            
            log.info("Call rejected by {} to {}", from, to);
            
            // Notify caller about rejection using topic
            final String destination = "/topic/" + to + "/call";
            messagingTemplate.convertAndSend(destination, message);
        } catch (Exception e) {
            log.error("Error handling call rejection", e);
        }
    }

    /**
     * Handle call accepted notification
     * Notifies caller that receiver accepted the call
     */
    @MessageMapping("/call/accepted")
    public void handleCallAccepted(@Payload Map<String, Object> message) {
        try {
            String to = (String) message.get("to");
            String from = (String) message.get("from");
            
            log.info("Call accepted by {} to {}", from, to);
            
            // Notify caller that call was accepted using topic
            final String destination = "/topic/" + to + "/call";
            messagingTemplate.convertAndSend(destination, message);
        } catch (Exception e) {
            log.error("Error handling call acceptance", e);
        }
    }

    /**
     * Handle call end/hangup
     * Notifies the other user that the call has ended
     */
    @MessageMapping("/call/end")
    public void handleCallEnd(@Payload Map<String, Object> message) {
        try {
            String to = (String) message.get("to");
            String from = (String) message.get("from");
            
            log.info("Call ended by {} to {}", from, to);
            
            // Notify other user that call ended using topic
            final String destination = "/topic/" + to + "/call";
            messagingTemplate.convertAndSend(destination, message);
        } catch (Exception e) {
            log.error("Error handling call end", e);
        }
    }

    /**
     * Save call history
     */
    @PostMapping("/api/call-history")
    public ResponseEntity<CallHistory> saveCallHistory(@RequestBody Map<String, Object> callData) {
        try {
            UUID callerId = UUID.fromString((String) callData.get("callerId"));
            UUID receiverId = UUID.fromString((String) callData.get("receiverId"));
            String callType = (String) callData.get("callType");
            String callStatus = (String) callData.get("callStatus");
            Integer duration = callData.get("duration") != null ? (Integer) callData.get("duration") : null;
            UUID chatId = callData.get("chatId") != null ? UUID.fromString((String) callData.get("chatId")) : null;

            CallHistory history = callHistoryService.saveCallHistory(callerId, receiverId, callType, callStatus, duration, chatId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Error saving call history", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get user's call history
     */
    @GetMapping("/api/call-history/user/{userId}")
    public ResponseEntity<List<CallHistory>> getUserCallHistory(@PathVariable UUID userId) {
        try {
            List<CallHistory> history = callHistoryService.getUserCallHistory(userId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Error fetching call history", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get chat's call history
     */
    @GetMapping("/api/call-history/chat/{chatId}")
    public ResponseEntity<List<CallHistory>> getChatCallHistory(@PathVariable UUID chatId) {
        try {
            List<CallHistory> history = callHistoryService.getChatCallHistory(chatId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            log.error("Error fetching chat call history", e);
            return ResponseEntity.badRequest().build();
        }
    }
}
