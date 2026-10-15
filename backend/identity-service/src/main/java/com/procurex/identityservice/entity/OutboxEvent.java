package com.procurex.identityservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "outbox_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutboxEvent {

    public enum Status {
        PENDING, PUBLISHED, FAILED
    }

    @Id
    @UuidGenerator
    private UUID eventId;

    private String eventType;
    private String aggregateType;
    private UUID   aggregateId;
    private String payload;
    private int    retryCount;

    @Enumerated(EnumType.STRING)
    private Status status;

    private LocalDateTime createdAt;
    private LocalDateTime publishedAt;

    @PrePersist
    void prePersist() {
        createdAt  = LocalDateTime.now();
        status     = Status.PENDING;
        retryCount = 0;
    }
}
