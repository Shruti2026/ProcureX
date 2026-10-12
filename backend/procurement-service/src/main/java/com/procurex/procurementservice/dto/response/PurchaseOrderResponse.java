package com.procurex.procurementservice.dto.response;

import com.procurex.procurementservice.entity.POStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PurchaseOrderResponse(
        UUID purchaseOrderId,
        String poNumber,
        UUID vendorId,
        String companyName,
        LocalDate orderDate,
        LocalDate expectedDelivery,
        BigDecimal totalAmount,
        POStatus status,
        UUID approvedBy,
        List<PurchaseOrderItemResponse> items,
        List<PurchaseOrderHistoryResponse> history,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
