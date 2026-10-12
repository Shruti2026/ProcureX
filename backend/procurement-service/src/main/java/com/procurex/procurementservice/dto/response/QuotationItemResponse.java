package com.procurex.procurementservice.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record QuotationItemResponse(
        UUID quotationItemId,
        UUID productId,
        String productName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice
) {}
