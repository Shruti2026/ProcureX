package com.procurex.identityservice.dto.response;

import com.procurex.identityservice.entity.AccountStatus;

import java.util.UUID;

/**
 * Response returned after successful vendor self-registration.
 * The account status will always be PENDING at this point —
 * the vendor must be approved by an admin before they can log in.
 */
public record VendorRegisterResponse(
        UUID userId,
        String email,
        String companyName,
        AccountStatus accountStatus,
        String message
) {}
