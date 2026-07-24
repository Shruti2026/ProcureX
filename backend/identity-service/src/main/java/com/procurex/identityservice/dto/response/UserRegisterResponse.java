package com.procurex.identityservice.dto.response;

import com.procurex.identityservice.entity.AccountStatus;
import java.util.UUID;

public record UserRegisterResponse(
        UUID userId,
        UUID organizationId,
        String fullName,
        String email,
        String role,
        AccountStatus accountStatus
) {}
