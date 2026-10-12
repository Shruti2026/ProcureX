package com.procurex.inventoryservice.dto.response;

import com.procurex.inventoryservice.enums.InspectionStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record InspectionResponse(
        UUID inspectionId,
        UUID grnId,
        InspectionStatus status,
        UUID inspectedBy,
        LocalDateTime inspectedAt,
        List<InspectionItemResponse> items
) {}
