package com.procurex.identityservice.dto.response;

import java.util.UUID;

public record LoginResponse(
        String accessToken,
        int expiresIn,          // 900 seconds
        UUID userId,
        String role,
        UUID organizationId
) {}
