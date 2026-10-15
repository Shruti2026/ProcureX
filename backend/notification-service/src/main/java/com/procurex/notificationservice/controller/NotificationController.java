package com.procurex.notificationservice.controller;

import com.procurex.notificationservice.dto.request.UpdatePreferencesRequest;
import com.procurex.notificationservice.dto.response.NotificationResponse;
import com.procurex.notificationservice.dto.response.PreferencesResponse;
import com.procurex.notificationservice.service.NotificationService;
import com.procurex.notificationservice.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        Page<NotificationResponse> result =
                notificationService.getMyNotifications(userId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success("Notifications retrieved", result));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.success("Unread count retrieved", count));
    }

    @GetMapping("/preferences")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PreferencesResponse>> getPreferences(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        UUID orgId  = extractOrgId(auth);
        PreferencesResponse prefs = notificationService.getPreferences(userId, orgId);
        return ResponseEntity.ok(ApiResponse.success("Preferences retrieved", prefs));
    }

    @PutMapping("/preferences")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PreferencesResponse>> updatePreferences(
            @RequestBody UpdatePreferencesRequest request, Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        UUID orgId  = extractOrgId(auth);
        PreferencesResponse prefs = notificationService.updatePreferences(
                userId, orgId, request.emailEnabled(), request.inAppEnabled());
        return ResponseEntity.ok(ApiResponse.success("Preferences updated", prefs));
    }

    @SuppressWarnings("unchecked")
    private UUID extractOrgId(Authentication auth) {
        Map<String, Object> details = (Map<String, Object>) auth.getDetails();
        String orgIdStr = (String) details.get("organizationId");
        return (orgIdStr != null && !orgIdStr.isBlank())
                ? UUID.fromString(orgIdStr)
                : UUID.randomUUID();
    }
}
