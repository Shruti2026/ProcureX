package com.procurex.financeservice.dto.request;

import com.procurex.financeservice.entity.PaymentMethod;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

@Schema(description = "Request body for initiating a payment against an approved invoice")
public record InitiatePaymentRequest(

        @Schema(description = "ID of the invoice to pay (must be in APPROVED status)", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
        @NotNull
        UUID invoiceId,

        @Schema(description = "Payment method to use", example = "ACH",
                allowableValues = {"ACH", "WIRE", "CHECK"})
        @NotNull
        PaymentMethod paymentMethod

) {}
