package com.procurex.procurementservice.dto.response;

import com.procurex.procurementservice.entity.QuotationStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record QuotationResponse(
        UUID quotationId,
        UUID rfqId,
        String rfqNumber,
        UUID vendorId,
        String companyName,
        BigDecimal totalAmount,
        Integer deliveryDays,
        String paymentTerms,
        LocalDate validityDate,
        QuotationStatus status,
        List<QuotationItemResponse> items,
        LocalDateTime submittedAt
) {}
