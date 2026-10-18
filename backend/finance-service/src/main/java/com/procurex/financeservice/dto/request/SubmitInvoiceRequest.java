package com.procurex.financeservice.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

@Schema(description = "Request body for a vendor to submit an invoice against an approved Purchase Order")
public record SubmitInvoiceRequest(

        @Schema(description = "ID of the Purchase Order this invoice is for (must be APPROVED or ACCEPTED)", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
        @NotNull
        UUID purchaseOrderId,

        @Schema(description = "Line items being invoiced — must correspond to items in the PO")
        @NotEmpty
        List<@Valid InvoiceItemRequest> items

) {}
