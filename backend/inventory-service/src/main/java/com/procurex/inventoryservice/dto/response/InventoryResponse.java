package com.procurex.inventoryservice.dto.response;

import java.util.UUID;

public record InventoryResponse(
        UUID inventoryId,
        UUID productId,
        UUID warehouseId,
        String warehouseName,
        Integer quantityOnHand,
        Integer quantityReserved
) {}
