package com.procurex.identityservice.dto.request;

import com.procurex.identityservice.entity.AccountStatus;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for updating a user's account status.
 */
public record UpdateStatusRequest(
    @NotNull(message = "Account status cannot be null")
    AccountStatus status
) {}
