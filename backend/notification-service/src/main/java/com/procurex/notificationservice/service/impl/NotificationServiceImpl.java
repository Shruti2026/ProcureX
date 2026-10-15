package com.procurex.notificationservice.service.impl;

import com.procurex.notificationservice.dto.response.NotificationResponse;
import com.procurex.notificationservice.dto.response.PreferencesResponse;
import com.procurex.notificationservice.entity.Notification;
import com.procurex.notificationservice.entity.NotificationPreference;
import com.procurex.notificationservice.repository.NotificationPreferenceRepository;
import com.procurex.notificationservice.repository.NotificationRepository;
import com.procurex.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository           notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;

    @Override
    public void saveAndSendEmail(UUID recipientId, String recipientEmail, UUID orgId,
                                 String eventType, String title, String message,
                                 Runnable sendAction) {
        boolean emailEnabled = preferenceRepository.findByUserId(recipientId)
                .map(p -> Boolean.TRUE.equals(p.getEmailEnabled()))
                .orElse(true);

        Notification notification = Notification.builder()
                .organizationId(orgId)
                .recipientId(recipientId)
                .recipientEmail(recipientEmail != null ? recipientEmail : "")
                .eventType(eventType)
                .title(title)
                .message(message)
                .channel(Notification.Channel.EMAIL)
                .build();
        notification = notificationRepository.save(notification);

        if (emailEnabled && recipientEmail != null && !recipientEmail.isBlank()) {
            try {
                sendAction.run();
                notification.setStatus(Notification.Status.SENT);
                notification.setSentAt(LocalDateTime.now());
            } catch (Exception e) {
                log.error("Email send failed for {}: {}", recipientEmail, e.getMessage());
                notification.setStatus(Notification.Status.FAILED);
                notification.setErrorMessage(e.getMessage());
            }
        } else {
            notification.setStatus(Notification.Status.FAILED);
            notification.setErrorMessage(emailEnabled
                    ? "No email address provided"
                    : "Email notifications disabled by user");
        }
        notificationRepository.save(notification);

        // Also create in-app
        saveInApp(recipientId, recipientEmail, orgId, eventType, title, message);
    }

    @Override
    public void saveInApp(UUID recipientId, String recipientEmail, UUID orgId,
                          String eventType, String title, String message) {
        Notification inApp = Notification.builder()
                .organizationId(orgId)
                .recipientId(recipientId != null ? recipientId : UUID.randomUUID())
                .recipientEmail(recipientEmail != null ? recipientEmail : "")
                .eventType(eventType)
                .title(title)
                .message(message)
                .channel(Notification.Channel.IN_APP)
                .status(Notification.Status.SENT)
                .sentAt(LocalDateTime.now())
                .build();
        notificationRepository.save(inApp);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getMyNotifications(UUID recipientId, Pageable pageable) {
        return notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(recipientId, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID recipientId) {
        return notificationRepository.countByRecipientIdAndStatus(
                recipientId, Notification.Status.PENDING);
    }

    @Override
    @Transactional(readOnly = true)
    public PreferencesResponse getPreferences(UUID userId, UUID orgId) {
        return preferenceRepository.findByUserId(userId)
                .map(p -> new PreferencesResponse(
                        p.getPreferenceId(),
                        Boolean.TRUE.equals(p.getEmailEnabled()),
                        Boolean.TRUE.equals(p.getInAppEnabled())))
                .orElse(new PreferencesResponse(null, true, true));
    }

    @Override
    public PreferencesResponse updatePreferences(UUID userId, UUID orgId,
                                                  boolean emailEnabled, boolean inAppEnabled) {
        NotificationPreference pref = preferenceRepository.findByUserId(userId)
                .orElse(NotificationPreference.builder()
                        .userId(userId)
                        .organizationId(orgId)
                        .build());
        pref.setEmailEnabled(emailEnabled);
        pref.setInAppEnabled(inAppEnabled);
        NotificationPreference saved = preferenceRepository.save(pref);
        return new PreferencesResponse(saved.getPreferenceId(), emailEnabled, inAppEnabled);
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getNotificationId(),
                n.getEventType(),
                n.getTitle(),
                n.getMessage(),
                n.getChannel(),
                n.getStatus(),
                n.getCreatedAt(),
                n.getSentAt()
        );
    }
}
