package com.procurex.inventoryservice.dto.response;

import java.util.UUID;

public record InspectionItemResponse(
        UUID productId,
        Integer acceptedQuantity,
        Integer rejectedQuantity,
        String reasonForRejection
) {}
