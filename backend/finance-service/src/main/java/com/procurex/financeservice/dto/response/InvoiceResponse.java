package com.procurex.financeservice.dto.response;

import com.procurex.financeservice.entity.InvoiceStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record InvoiceResponse(
        UUID invoiceId,
        String invoiceNumber,
        UUID purchaseOrderId,
        UUID vendorId,
        BigDecimal invoiceAmount,
        InvoiceStatus status,
        List<InvoiceItemResponse> items,
        List<InvoiceHistoryResponse> history,
        MatchResult matchResult,
        LocalDateTime submittedAt,
        LocalDateTime verifiedAt,
        LocalDateTime approvedAt
) {}
