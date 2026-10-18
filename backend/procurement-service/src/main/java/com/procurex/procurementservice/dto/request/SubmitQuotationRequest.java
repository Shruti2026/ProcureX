package com.procurex.procurementservice.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Schema(description = "Request body for a vendor to submit a quotation against an open RFQ")
public record SubmitQuotationRequest(

        @Schema(description = "ID of the RFQ being responded to", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
        @NotNull
        UUID rfqId,

        @Schema(description = "Date until which this quotation is valid (must be a future date)", example = "2026-12-01")
        @NotNull
        @Future
        LocalDate validityDate,

        @Schema(description = "Number of days required for delivery after PO is issued (minimum 1)", example = "14")
        @Min(1)
        int deliveryDays,

        @Schema(description = "Payment terms offered by the vendor", example = "Net 30 days")
        String paymentTerms,

        @Schema(description = "Line items with unit prices for each product in the RFQ")
        @NotEmpty
        @Size(min = 1)
        List<@Valid QuotationItemRequest> items

) {}
