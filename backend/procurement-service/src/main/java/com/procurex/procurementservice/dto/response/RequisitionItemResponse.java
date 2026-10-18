package com.procurex.procurementservice.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

@Schema(description = "A single line item in a Purchase Requisition response")
public record RequisitionItemResponse(

        @Schema(description = "Unique identifier of this line item")
        UUID requisitionItemId,

        @Schema(description = "Product ID from the vendor catalog")
        UUID productId,

        @Schema(description = "Product name at the time of requisition creation", example = "Dell Latitude 5540 Laptop")
        String productName,

        @Schema(description = "Unit of measure for the product", example = "unit")
        String unitOfMeasure,

        @Schema(description = "Quantity requested", example = "5")
        int quantity,

        @Schema(description = "Optional remarks for this line item", example = "Prefer 16GB RAM variant")
        String remarks

) {}
