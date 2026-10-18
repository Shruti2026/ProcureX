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

@Schema(description = "Request body for updating an existing Purchase Requisition (only allowed in CREATED status)")
public record UpdateRequisitionRequest(

        @Schema(description = "Updated title for the requisition", example = "Q3 Office Hardware Upgrade — revised")
        @NotBlank(message = "Title is required")
        @Size(max = 150, message = "Title must not exceed 150 characters")
        String title,

        @Schema(description = "Updated description", example = "Added 5 more laptops to the original request")
        String description,

        @Schema(description = "Updated required delivery date (today or future)", example = "2026-12-15")
        @NotNull(message = "Required date is required")
        @FutureOrPresent(message = "Required date must be today or in the future")
        LocalDate requiredDate,

        @Schema(description = "Updated line items — at least one item required")
        @NotEmpty(message = "At least one item is required")
        @Size(min = 1, message = "At least one item is required")
        @Valid
        List<RequisitionItemRequest> items

) {}
