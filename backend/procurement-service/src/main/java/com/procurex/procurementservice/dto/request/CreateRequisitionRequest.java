package com.procurex.procurementservice.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

@Schema(description = "Request body for creating a new Purchase Requisition")
public record CreateRequisitionRequest(

        @Schema(description = "Short title describing what is being requested", example = "Q3 Office Hardware Upgrade")
        @NotBlank(message = "Title is required")
        @Size(max = 150, message = "Title must not exceed 150 characters")
        String title,

        @Schema(description = "Optional additional details for the approver", example = "Required for new joinees onboarding in October")
        String description,

        @Schema(description = "Date by which the items must be delivered (today or future)", example = "2026-11-30")
        @NotNull(message = "Required date is required")
        @FutureOrPresent(message = "Required date must be today or in the future")
        LocalDate requiredDate,

        @Schema(description = "Line items — at least one item is required")
        @NotEmpty(message = "At least one item is required")
        @Size(min = 1, message = "At least one item is required")
        @Valid
        List<RequisitionItemRequest> items

) {}
