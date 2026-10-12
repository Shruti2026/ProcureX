package com.procurex.procurementservice.dto.response;

import com.procurex.procurementservice.entity.POStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record PurchaseOrderHistoryResponse(
        POStatus fromStatus,
        POStatus toStatus,
        String remarks,
        UUID changedBy,
        LocalDateTime changedAt
) {}
