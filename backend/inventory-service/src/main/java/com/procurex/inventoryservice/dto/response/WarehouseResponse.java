package com.procurex.inventoryservice.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record WarehouseResponse(
        UUID warehouseId,
        String warehouseName,
        String location,
        Integer capacity,
        LocalDateTime createdAt
) {}
