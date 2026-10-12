package com.procurex.inventoryservice.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record GrnItemRequest(
        @NotNull(message = "Product ID is required")
        UUID productId,

        @Min(value = 1, message = "Quantity received must be at least 1")
        int quantityReceived
) {}
