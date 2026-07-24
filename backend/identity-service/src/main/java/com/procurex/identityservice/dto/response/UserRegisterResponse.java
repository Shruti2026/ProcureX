package com.procurex.identityservice.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.procurex.identityservice.entity.AccountStatus;

import java.util.UUID;

public record UserRegisterResponse(
        UUID userId,
        UUID organizationId,
        String fullName,
        String email,
        String role,
        AccountStatus accountStatus,

        /**
         * Only populated for admin-created employees.
         * Null for all other user creation flows.
         * The admin must securely communicate this to the employee.
         */
        @JsonInclude(JsonInclude.Include.NON_NULL)
        String temporaryPassword
) {}

