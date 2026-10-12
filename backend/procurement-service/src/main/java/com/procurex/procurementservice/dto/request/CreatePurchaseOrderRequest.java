package com.procurex.procurementservice.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreatePurchaseOrderRequest(
        @NotNull UUID quotationId,
        @NotNull @Future LocalDate expectedDelivery
) {}
