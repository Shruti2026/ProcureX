package com.procurex.procurementservice.dto.response;

import com.procurex.procurementservice.entity.RFQStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Schema(description = "Request for Quotation (RFQ) details")
public record RFQResponse(

        @Schema(description = "Unique identifier of the RFQ")
        UUID rfqId,

        @Schema(description = "ID of the Purchase Requisition this RFQ is based on")
        UUID requisitionId,

        @Schema(description = "Title of the originating requisition", example = "Q3 Office Hardware Upgrade")
        String requisitionTitle,

        @Schema(description = "Auto-generated RFQ number", example = "RFQ-2026-0015")
        String rfqNumber,

        @Schema(description = "Date the RFQ was issued", example = "2026-10-16")
        LocalDate issueDate,

        @Schema(description = "Deadline for vendor quotation submissions", example = "2026-11-15")
        LocalDate closingDate,

        @Schema(description = "Current status of the RFQ", example = "OPEN",
                allowableValues = {"OPEN", "EVALUATING", "AWARDED", "CLOSED"})
        RFQStatus status,

        @Schema(description = "Vendors invited to submit quotations")
        List<RFQVendorResponse> invitedVendors,

        @Schema(description = "User who created the RFQ")
        UUID createdBy,

        @Schema(description = "Timestamp when the RFQ was created")
        LocalDateTime createdAt,

        @Schema(description = "Timestamp of the last update")
        LocalDateTime updatedAt

) {}
