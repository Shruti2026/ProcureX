package com.procurex.procurementservice.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

@Schema(description = "Request body for creating a Purchase Order from a selected quotation")
public record CreatePurchaseOrderRequest(

        @Schema(description = "ID of the SUBMITTED quotation to create the PO from", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
        @NotNull
        UUID quotationId,

        @Schema(description = "Expected delivery date — must be a future date", example = "2026-12-20")
        @NotNull
        @Future
        LocalDate expectedDelivery

) {}
