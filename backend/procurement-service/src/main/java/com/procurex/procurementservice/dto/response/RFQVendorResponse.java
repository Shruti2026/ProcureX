package com.procurex.procurementservice.dto.response;

import com.procurex.procurementservice.entity.InvitationStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record RFQVendorResponse(
        UUID rfqVendorId,
        UUID vendorId,
        String companyName,
        InvitationStatus invitationStatus,
        LocalDateTime createdAt
) {}
