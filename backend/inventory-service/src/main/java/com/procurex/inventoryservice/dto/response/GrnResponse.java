package com.procurex.inventoryservice.dto.response;

import com.procurex.inventoryservice.enums.GrnStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record GrnResponse(
        UUID grnId,
        String grnNumber,
        UUID purchaseOrderId,
        UUID warehouseId,
        String warehouseName,
        GrnStatus status,
        UUID receivedBy,
        LocalDateTime receivedAt,
        List<GrnItemResponse> items
) {}
