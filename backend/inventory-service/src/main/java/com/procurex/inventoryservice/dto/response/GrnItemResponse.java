package com.procurex.inventoryservice.dto.response;

import java.util.UUID;

public record GrnItemResponse(
        UUID grnItemId,
        UUID productId,
        String productName,
        Integer quantityOrdered,
        Integer quantityReceived
) {}
