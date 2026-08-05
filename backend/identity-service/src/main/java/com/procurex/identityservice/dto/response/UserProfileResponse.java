package com.procurex.identityservice.dto.response;

import com.procurex.identityservice.entity.AccountStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record UserProfileResponse(
        UUID userId,
        UUID organizationId,
        String fullName,
        String email,
        String phoneNumber,
        String role,
        AccountStatus accountStatus,
        LocalDateTime lastLogin,
        LocalDateTime createdAt
) {}
