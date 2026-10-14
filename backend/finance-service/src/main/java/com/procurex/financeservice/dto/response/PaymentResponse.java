package com.procurex.financeservice.dto.response;

import com.procurex.financeservice.entity.PaymentMethod;
import com.procurex.financeservice.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record PaymentResponse(
        UUID paymentId,
        UUID invoiceId,
        BigDecimal amount,
        PaymentMethod paymentMethod,
        String transactionReference,
        PaymentStatus status,
        LocalDateTime initiatedAt,
        LocalDateTime completedAt
) {}
