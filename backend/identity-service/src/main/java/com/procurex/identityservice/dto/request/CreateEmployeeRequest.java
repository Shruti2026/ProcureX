package com.procurex.identityservice.dto.request;

import com.procurex.identityservice.entity.RoleName;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * DTO for admin-initiated internal employee creation.
 * No password field — a temporary password is auto-generated server-side
 * and returned in the response.
 * Allowed roles: PROCUREMENT_MANAGER, INVENTORY_MANAGER, FINANCE_MANAGER.
 * VENDOR and ADMIN are explicitly rejected by the service layer.
 */
public record CreateEmployeeRequest(

        @NotBlank(message = "Full name is required")
        @Size(max = 100, message = "Full name must not exceed 100 characters")
        String fullName,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be a valid email address")
        @Size(max = 100, message = "Email must not exceed 100 characters")
        String email,

        @NotNull(message = "Role is required")
        RoleName role,

        @NotNull(message = "Organization ID is required")
        UUID organizationId,

        @Size(max = 15, message = "Phone number must not exceed 15 characters")
        String phoneNumber
) {}
