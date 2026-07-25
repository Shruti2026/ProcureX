package com.procurex.identityservice.dto.response;

import com.procurex.identityservice.entity.AccountStatus;

import java.util.UUID;

/**
 * Response payload returned after a vendor successfully registers.
 *
 * @param userId identifier of the newly created vendor account
 * @param email registered email address
 * @param companyName registered company name
 * @param accountStatus current account status (typically PENDING)
 * @param message additional information for the vendor
 */
public record VendorRegisterResponse(
        UUID userId,
        String email,
        String companyName,
        AccountStatus accountStatus,
        String message
) {}
