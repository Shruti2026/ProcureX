package com.procurex.notificationservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    public enum Channel { EMAIL, IN_APP }
    public enum Status  { PENDING, SENT, FAILED }

    @Id
    @UuidGenerator
    private UUID notificationId;

    private UUID organizationId;
    private UUID recipientId;
    private String recipientEmail;

    private String eventType;
    private String title;
    private String message;

    @Enumerated(EnumType.STRING)
    private Channel channel;

    @Enumerated(EnumType.STRING)
    private Status status;

    private String errorMessage;
    private LocalDateTime sentAt;
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        status    = Status.PENDING;
    }
}
