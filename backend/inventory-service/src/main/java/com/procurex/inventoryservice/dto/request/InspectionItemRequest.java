package com.procurex.inventoryservice.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record InspectionItemRequest(
        @NotNull(message = "Product ID is required")
        UUID productId,

        @Min(value = 0, message = "Accepted quantity must be 0 or greater")
        int acceptedQuantity,

        @Min(value = 0, message = "Rejected quantity must be 0 or greater")
        int rejectedQuantity,

        String reasonForRejection
) {}
