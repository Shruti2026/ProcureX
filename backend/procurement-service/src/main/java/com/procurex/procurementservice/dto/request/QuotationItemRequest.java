package com.procurex.procurementservice.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

@Schema(description = "A single line item in a vendor quotation")
public record QuotationItemRequest(

        @Schema(description = "Product ID matching a line item from the RFQ", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
        @NotNull
        UUID productId,

        @Schema(description = "Quantity being quoted (must match or exceed the RFQ quantity)", example = "5")
        @Min(1)
        int quantity,

        @Schema(description = "Vendor's offered unit price in INR (minimum 0.01)", example = "48500.00")
        @NotNull
        @DecimalMin("0.01")
        BigDecimal unitPrice

) {}
