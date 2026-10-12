package com.procurex.procurementservice.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record SubmitQuotationRequest(
        @NotNull UUID rfqId,
        @NotNull @Future LocalDate validityDate,
        @Min(1) int deliveryDays,
        String paymentTerms,
        @NotEmpty @Size(min = 1) List<@Valid QuotationItemRequest> items
) {}
