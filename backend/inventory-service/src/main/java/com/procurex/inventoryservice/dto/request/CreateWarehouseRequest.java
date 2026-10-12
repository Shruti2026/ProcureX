package com.procurex.inventoryservice.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CreateWarehouseRequest(
        @NotBlank(message = "Warehouse name is required")
        String warehouseName,

        @NotBlank(message = "Location is required")
        String location,

        @Min(value = 1, message = "Capacity must be at least 1")
        Integer capacity
) {}
