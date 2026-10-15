package com.procurex.notificationservice.service;

import com.procurex.notificationservice.dto.response.NotificationResponse;
import com.procurex.notificationservice.dto.response.PreferencesResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface NotificationService {

    void saveAndSendEmail(UUID recipientId, String recipientEmail, UUID orgId,
                          String eventType, String title, String message,
                          Runnable sendAction);

    void saveInApp(UUID recipientId, String recipientEmail, UUID orgId,
                   String eventType, String title, String message);

    Page<NotificationResponse> getMyNotifications(UUID recipientId, Pageable pageable);

    long getUnreadCount(UUID recipientId);

    PreferencesResponse getPreferences(UUID userId, UUID orgId);

    PreferencesResponse updatePreferences(UUID userId, UUID orgId,
                                          boolean emailEnabled, boolean inAppEnabled);
}
