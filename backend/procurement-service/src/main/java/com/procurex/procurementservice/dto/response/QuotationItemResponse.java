package com.procurex.procurementservice.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.util.UUID;

@Schema(description = "A single line item in a vendor quotation")
public record QuotationItemResponse(

        @Schema(description = "Unique identifier of this quotation line item")
        UUID quotationItemId,

        @Schema(description = "Product ID from the vendor catalog")
        UUID productId,

        @Schema(description = "Product name", example = "Dell Latitude 5540 Laptop")
        String productName,

        @Schema(description = "Quantity quoted", example = "5")
        Integer quantity,

        @Schema(description = "Vendor's offered unit price in INR", example = "48500.00")
        BigDecimal unitPrice,

        @Schema(description = "Total price for this line (quantity × unitPrice)", example = "242500.00")
        BigDecimal totalPrice

) {}
