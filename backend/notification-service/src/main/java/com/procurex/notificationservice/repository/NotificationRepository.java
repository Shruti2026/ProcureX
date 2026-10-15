package com.procurex.notificationservice.repository;

import com.procurex.notificationservice.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId, Pageable pageable);

    Page<Notification> findByOrganizationIdOrderByCreatedAtDesc(UUID orgId, Pageable pageable);

    long countByRecipientIdAndStatus(UUID recipientId, Notification.Status status);
}
