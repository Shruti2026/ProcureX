package com.procurex.financeservice.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record InvoiceItemResponse(
        UUID invoiceItemId,
        UUID productId,
        String productName,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice
) {}
