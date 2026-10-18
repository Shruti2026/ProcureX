package com.procurex.financeservice.dto.response;

import com.procurex.financeservice.entity.InvoiceStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.UUID;

@Schema(description = "A single entry in the invoice status history")
public record InvoiceHistoryResponse(

        @Schema(description = "Previous status before this transition (null for initial submission)", example = "PENDING_VERIFICATION")
        InvoiceStatus fromStatus,

        @Schema(description = "Status after this transition", example = "VERIFIED")
        InvoiceStatus toStatus,

        @Schema(description = "Remarks recorded at the time of the status change", example = "3-way match passed — all quantities and prices match")
        String remarks,

        @Schema(description = "ID of the user who made this status change")
        UUID changedBy,

        @Schema(description = "Timestamp when the status change occurred")
        LocalDateTime changedAt

) {}
