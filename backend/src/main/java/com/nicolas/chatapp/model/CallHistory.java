package com.nicolas.chatapp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "call_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "caller_id", nullable = false)
    private User caller;

    @ManyToOne
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Column(name = "call_type", nullable = false)
    private String callType; // 'voice' or 'video'

    @Column(name = "call_status", nullable = false)
    private String callStatus; // 'completed', 'missed', 'rejected', 'cancelled'

    @Column(name = "duration")
    private Integer duration; // Duration in seconds, null if not answered

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "chat_id")
    private Chat chat;
}
