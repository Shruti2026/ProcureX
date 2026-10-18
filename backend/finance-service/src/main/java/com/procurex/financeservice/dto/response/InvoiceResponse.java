package com.procurex.financeservice.dto.response;

import com.procurex.financeservice.entity.InvoiceStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Schema(description = "Invoice details including line items, status history, and 3-way match result")
public record InvoiceResponse(

        @Schema(description = "Unique identifier of the invoice")
        UUID invoiceId,

        @Schema(description = "Auto-generated invoice number", example = "INV-2026-0034")
        String invoiceNumber,

        @Schema(description = "ID of the Purchase Order this invoice is for")
        UUID purchaseOrderId,

        @Schema(description = "Vendor's user ID who submitted the invoice")
        UUID vendorId,

        @Schema(description = "Total invoice amount in INR", example = "242500.00")
        BigDecimal invoiceAmount,

        @Schema(description = "Current verification status of the invoice", example = "PENDING_VERIFICATION",
                allowableValues = {"PENDING_VERIFICATION", "VERIFIED", "FLAGGED_VARIANCE", "APPROVED", "REJECTED", "PAID"})
        InvoiceStatus status,

        @Schema(description = "Line items in this invoice")
        List<InvoiceItemResponse> items,

        @Schema(description = "Status change history of this invoice")
        List<InvoiceHistoryResponse> history,

        @Schema(description = "3-way match result (populated after running match — null if not yet matched)")
        MatchResult matchResult,

        @Schema(description = "Timestamp when the invoice was submitted")
        LocalDateTime submittedAt,

        @Schema(description = "Timestamp when the invoice was verified via 3-way match (null if not yet)")
        LocalDateTime verifiedAt,

        @Schema(description = "Timestamp when the invoice was approved for payment (null if not yet)")
        LocalDateTime approvedAt

) {}
