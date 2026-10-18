package com.procurex.procurementservice.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Schema(description = "Request body for creating a new Request for Quotation (RFQ)")
public record CreateRFQRequest(

        @Schema(description = "ID of the approved Purchase Requisition this RFQ is based on", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
        @NotNull
        UUID requisitionId,

        @Schema(description = "Date by which vendor quotations must be submitted (must be a future date)", example = "2026-11-15")
        @NotNull
        @Future
        LocalDate closingDate,

        @Schema(description = "List of vendor IDs to invite (1–20 vendors)", example = "[\"3fa85f64-5717-4562-b3fc-2c963f66afa6\"]")
        @NotEmpty
        @Size(min = 1, max = 20)
        List<@NotNull UUID> invitedVendorIds

) {}
