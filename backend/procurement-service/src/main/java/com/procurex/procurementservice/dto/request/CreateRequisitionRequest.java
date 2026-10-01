package com.procurex.procurementservice.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record CreateRequisitionRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 150, message = "Title must not exceed 150 characters")
        String title,

        String description,

        @NotNull(message = "Required date is required")
        @FutureOrPresent(message = "Required date must be today or in the future")
        LocalDate requiredDate,

        @NotEmpty(message = "At least one item is required")
        @Size(min = 1, message = "At least one item is required")
        @Valid
        List<RequisitionItemRequest> items
) {}
