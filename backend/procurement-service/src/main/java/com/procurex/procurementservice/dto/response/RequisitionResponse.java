package com.procurex.procurementservice.dto.response;

import com.procurex.procurementservice.entity.RequisitionStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Schema(description = "Purchase Requisition details")
public record RequisitionResponse(

        @Schema(description = "Unique identifier of the requisition", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
        UUID requisitionId,

        @Schema(description = "Organization this requisition belongs to")
        UUID organizationId,

        @Schema(description = "Auto-generated requisition number", example = "PR-2026-0042")
        String requisitionNumber,

        @Schema(description = "Short title of the requisition", example = "Q3 Office Hardware Upgrade")
        String title,

        @Schema(description = "Additional description or context", example = "Required for new joinees")
        String description,

        @Schema(description = "Date by which delivery is required", example = "2026-11-30")
        LocalDate requiredDate,

        @Schema(description = "Current status of the requisition", example = "CREATED")
        RequisitionStatus status,

        @Schema(description = "Line items in this requisition")
        List<RequisitionItemResponse> items,

        @Schema(description = "User who created the requisition")
        UUID createdBy,

        @Schema(description = "Timestamp when the requisition was created")
        LocalDateTime createdAt,

        @Schema(description = "Timestamp of the last update")
        LocalDateTime updatedAt

) {}
