package com.procurex.financeservice.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

@Schema(description = "A single discrepancy found during 3-way match")
public record MatchFlag(

        @Schema(description = "Product ID that has the discrepancy")
        UUID productId,

        @Schema(description = "Product name for readability", example = "Dell Latitude 5540 Laptop")
        String productName,

        @Schema(description = "Type of discrepancy found", example = "QUANTITY_MISMATCH",
                allowableValues = {"QUANTITY_MISMATCH", "PRICE_MISMATCH"})
        String flagType,

        @Schema(description = "Human-readable description of the discrepancy", example = "Invoice qty 10 exceeds accepted qty 8")
        String details

) {}
