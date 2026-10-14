package com.procurex.financeservice.dto.response;

import com.procurex.financeservice.entity.InvoiceStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record InvoiceHistoryResponse(
        InvoiceStatus fromStatus,
        InvoiceStatus toStatus,
        String remarks,
        UUID changedBy,
        LocalDateTime changedAt
) {}
