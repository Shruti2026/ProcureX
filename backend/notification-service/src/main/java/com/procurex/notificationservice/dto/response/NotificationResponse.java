package com.procurex.notificationservice.dto.response;

import com.procurex.notificationservice.entity.Notification;

import java.time.LocalDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID notificationId,
        String eventType,
        String title,
        String message,
        Notification.Channel channel,
        Notification.Status status,
        LocalDateTime createdAt,
        LocalDateTime sentAt
) {}
