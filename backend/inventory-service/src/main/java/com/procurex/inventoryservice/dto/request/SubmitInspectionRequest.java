package com.procurex.inventoryservice.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record SubmitInspectionRequest(
        @NotNull(message = "GRN ID is required")
        UUID grnId,

        @NotEmpty(message = "At least one inspection item is required")
        List<@Valid InspectionItemRequest> items
) {}
