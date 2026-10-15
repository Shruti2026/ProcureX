package com.procurex.notificationservice.event.listener;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.procurex.notificationservice.service.EmailService;
import com.procurex.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

/**
 * Handles identity.vendor.approved events.
 * Payload: { userId, vendorId, organizationId, email, vendorName }
 * Sends vendor-approved email + in-app notification.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class VendorApprovedEventListener {

    private final NotificationService notificationService;
    private final EmailService        emailService;
    private final ObjectMapper        objectMapper;

    @RabbitListener(queues = "notification.vendor.approved.queue")
    public void handleVendorApproved(String payload) {
        try {
            Map<String, Object> event = objectMapper.readValue(payload, Map.class);

            UUID   userId   = UUID.fromString((String) event.get("userId"));
            UUID   orgId    = UUID.fromString((String) event.get("organizationId"));
            String email    = (String) event.get("email");
            String vendorName = (String) event.get("vendorName");

            String title   = "Vendor Account Approved";
            String message = "Your vendor account has been approved. You can now log in and respond to RFQ invitations.";

            notificationService.saveAndSendEmail(
                    userId, email, orgId,
                    "identity.vendor.approved", title, message,
                    () -> emailService.sendVendorApproved(email, vendorName)
            );

            log.info("Vendor approved notification sent for userId={}", userId);
        } catch (Exception e) {
            log.error("Failed to process vendor approved event: {}", e.getMessage(), e);
        }
    }
}
