package com.procurex.procurementservice.dto.response;

import com.procurex.procurementservice.entity.POStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.UUID;

@Schema(description = "A single entry in the Purchase Order status history timeline")
public record PurchaseOrderHistoryResponse(

        @Schema(description = "Previous status before this transition (null for the initial CREATED entry)", example = "CREATED")
        POStatus fromStatus,

        @Schema(description = "Status after this transition", example = "APPROVED")
        POStatus toStatus,

        @Schema(description = "Optional remarks recorded at the time of the status change", example = "Approved after budget verification")
        String remarks,

        @Schema(description = "ID of the user who made the status change")
        UUID changedBy,

        @Schema(description = "Timestamp when the status change occurred")
        LocalDateTime changedAt

) {}
