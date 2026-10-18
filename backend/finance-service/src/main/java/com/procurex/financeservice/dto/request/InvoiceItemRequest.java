package com.procurex.financeservice.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

@Schema(description = "A single line item in a vendor invoice")
public record InvoiceItemRequest(

        @Schema(description = "Product ID matching a line item in the Purchase Order")
        @NotNull
        UUID productId,

        @Schema(description = "Product name", example = "Dell Latitude 5540 Laptop")
        @NotBlank
        String productName,

        @Schema(description = "Quantity being invoiced (minimum 1)", example = "5")
        @Min(1)
        int quantity,

        @Schema(description = "Unit price being charged in INR (minimum ₹0.01)", example = "48500.00")
        @NotNull
        @DecimalMin("0.01")
        BigDecimal unitPrice

) {}
