package com.procurex.financeservice.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.util.UUID;

@Schema(description = "A single line item in an invoice")
public record InvoiceItemResponse(

        @Schema(description = "Unique identifier of this invoice line item")
        UUID invoiceItemId,

        @Schema(description = "Product ID from the vendor catalog")
        UUID productId,

        @Schema(description = "Product name", example = "Dell Latitude 5540 Laptop")
        String productName,

        @Schema(description = "Quantity invoiced", example = "5")
        int quantity,

        @Schema(description = "Unit price charged in INR", example = "48500.00")
        BigDecimal unitPrice,

        @Schema(description = "Total price for this line (quantity × unitPrice)", example = "242500.00")
        BigDecimal totalPrice

) {}
