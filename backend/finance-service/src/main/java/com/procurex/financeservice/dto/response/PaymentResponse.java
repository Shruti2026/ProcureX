package com.procurex.financeservice.dto.response;

import com.procurex.financeservice.entity.PaymentMethod;
import com.procurex.financeservice.entity.PaymentStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Schema(description = "Payment transaction details")
public record PaymentResponse(

        @Schema(description = "Unique identifier of the payment record")
        UUID paymentId,

        @Schema(description = "ID of the invoice this payment covers")
        UUID invoiceId,

        @Schema(description = "Total payment amount in INR", example = "242500.00")
        BigDecimal amount,

        @Schema(description = "Payment method used", example = "ACH",
                allowableValues = {"ACH", "WIRE", "CHECK"})
        PaymentMethod paymentMethod,

        @Schema(description = "Auto-generated transaction reference number", example = "TXN-2026-0021")
        String transactionReference,

        @Schema(description = "Current status of the payment", example = "COMPLETED",
                allowableValues = {"PENDING", "PROCESSING", "COMPLETED", "FAILED"})
        PaymentStatus status,

        @Schema(description = "Timestamp when the payment was initiated")
        LocalDateTime initiatedAt,

        @Schema(description = "Timestamp when the payment was completed (null if still processing)")
        LocalDateTime completedAt

) {}
