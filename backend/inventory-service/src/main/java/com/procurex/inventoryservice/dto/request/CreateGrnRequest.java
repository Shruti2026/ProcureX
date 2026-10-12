package com.procurex.inventoryservice.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record CreateGrnRequest(
        @NotNull(message = "Purchase order ID is required")
        UUID purchaseOrderId,

        @NotNull(message = "Warehouse ID is required")
        UUID warehouseId,

        @NotEmpty(message = "At least one item is required")
        List<@Valid GrnItemRequest> items
) {}
