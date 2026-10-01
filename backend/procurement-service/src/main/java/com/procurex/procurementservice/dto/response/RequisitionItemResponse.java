package com.procurex.procurementservice.dto.response;

import java.util.UUID;

public record RequisitionItemResponse(
        UUID requisitionItemId,
        UUID productId,
        String productName,
        String unitOfMeasure,
        int quantity,
        String remarks
) {}
