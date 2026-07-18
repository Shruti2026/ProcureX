package com.procurex.identityservice.dto.response;

public record TokenRefreshResponse(
        String accessToken,
        int expiresIn   // 900 seconds
) {}
