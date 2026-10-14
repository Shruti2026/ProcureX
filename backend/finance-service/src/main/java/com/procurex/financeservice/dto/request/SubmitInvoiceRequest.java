package com.procurex.financeservice.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record SubmitInvoiceRequest(
        @NotNull UUID purchaseOrderId,
        @NotEmpty List<@Valid InvoiceItemRequest> items
) {}
