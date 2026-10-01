package com.procurex.procurementservice.dto.response;

import com.procurex.procurementservice.entity.RequisitionStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record RequisitionResponse(
        UUID requisitionId,
        UUID organizationId,
        String requisitionNumber,
        String title,
        String description,
        LocalDate requiredDate,
        RequisitionStatus status,
        List<RequisitionItemResponse> items,
        UUID createdBy,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
