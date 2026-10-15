package com.procurex.notificationservice.dto.response;

import java.util.UUID;

public record PreferencesResponse(UUID preferenceId, boolean emailEnabled, boolean inAppEnabled) {}
