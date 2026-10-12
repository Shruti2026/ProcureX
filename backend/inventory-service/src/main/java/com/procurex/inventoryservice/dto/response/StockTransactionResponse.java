package com.procurex.inventoryservice.dto.response;

import com.procurex.inventoryservice.enums.TransactionType;

import java.time.LocalDateTime;
import java.util.UUID;

public record StockTransactionResponse(
        UUID transactionId,
        UUID productId,
        UUID warehouseId,
        TransactionType transactionType,
        Integer quantity,
        String referenceId,
        String referenceType,
        String remarks,
        LocalDateTime transactionAt
) {}
