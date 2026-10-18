package com.procurex.procurementservice.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

@Schema(description = "A single line item in a Purchase Requisition")
public record RequisitionItemRequest(

        @Schema(description = "Product ID from the vendor catalog", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
        @NotNull(message = "Product ID is required")
        UUID productId,

        @Schema(description = "Number of units required (minimum 1)", example = "10")
        @Min(value = 1, message = "Quantity must be at least 1")
        int quantity,

        @Schema(description = "Optional remarks for this line item", example = "Prefer Dell brand")
        String remarks

) {}
