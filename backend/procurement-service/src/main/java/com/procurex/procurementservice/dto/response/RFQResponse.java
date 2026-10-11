package com.procurex.procurementservice.dto.response;

import com.procurex.procurementservice.entity.RFQStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record RFQResponse(
        UUID rfqId,
        UUID requisitionId,
        String requisitionTitle,
        String rfqNumber,
        LocalDate issueDate,
        LocalDate closingDate,
        RFQStatus status,
        List<RFQVendorResponse> invitedVendors,
        UUID createdBy,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
