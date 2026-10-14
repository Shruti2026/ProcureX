package com.procurex.financeservice.dto.request;

import com.procurex.financeservice.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record InitiatePaymentRequest(
        @NotNull UUID invoiceId,
        @NotNull PaymentMethod paymentMethod
) {}
