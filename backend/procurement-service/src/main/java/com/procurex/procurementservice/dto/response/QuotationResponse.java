package com.procurex.procurementservice.dto.response;

import com.procurex.procurementservice.entity.QuotationStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Schema(description = "Vendor quotation details")
public record QuotationResponse(

        @Schema(description = "Unique identifier of the quotation")
        UUID quotationId,

        @Schema(description = "ID of the RFQ this quotation responds to")
        UUID rfqId,

        @Schema(description = "RFQ number for reference", example = "RFQ-2026-0015")
        String rfqNumber,

        @Schema(description = "Vendor's user ID")
        UUID vendorId,

        @Schema(description = "Vendor company name", example = "Acme Supplies Pvt. Ltd.")
        String companyName,

        @Schema(description = "Total quoted amount in INR", example = "242500.00")
        BigDecimal totalAmount,

        @Schema(description = "Number of days required for delivery after PO is issued", example = "14")
        Integer deliveryDays,

        @Schema(description = "Payment terms offered by the vendor", example = "Net 30 days")
        String paymentTerms,

        @Schema(description = "Date until which the quotation is valid", example = "2026-12-01")
        LocalDate validityDate,

        @Schema(description = "Current status of the quotation", example = "SUBMITTED",
                allowableValues = {"SUBMITTED", "SELECTED", "REJECTED"})
        QuotationStatus status,

        @Schema(description = "Line items with unit prices")
        List<QuotationItemResponse> items,

        @Schema(description = "Timestamp when the quotation was submitted")
        LocalDateTime submittedAt

) {}
