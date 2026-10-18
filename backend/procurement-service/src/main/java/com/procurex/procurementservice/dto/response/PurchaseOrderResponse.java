package com.procurex.procurementservice.dto.response;

import com.procurex.procurementservice.entity.POStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Schema(description = "Purchase Order details")
public record PurchaseOrderResponse(

        @Schema(description = "Unique identifier of the Purchase Order")
        UUID purchaseOrderId,

        @Schema(description = "Auto-generated PO number", example = "PO-2026-0008")
        String poNumber,

        @Schema(description = "Vendor's user ID")
        UUID vendorId,

        @Schema(description = "Vendor company name", example = "Acme Supplies Pvt. Ltd.")
        String companyName,

        @Schema(description = "Date the PO was created", example = "2026-10-16")
        LocalDate orderDate,

        @Schema(description = "Expected delivery date", example = "2026-12-20")
        LocalDate expectedDelivery,

        @Schema(description = "Total order value in INR", example = "242500.00")
        BigDecimal totalAmount,

        @Schema(description = "Current status of the PO", example = "APPROVED",
                allowableValues = {"CREATED", "APPROVED", "ACCEPTED", "DELIVERED", "COMPLETED", "CANCELLED"})
        POStatus status,

        @Schema(description = "ID of the manager who approved this PO (null if not yet approved)")
        UUID approvedBy,

        @Schema(description = "Line items in this Purchase Order")
        List<PurchaseOrderItemResponse> items,

        @Schema(description = "Status change history of this PO")
        List<PurchaseOrderHistoryResponse> history,

        @Schema(description = "Timestamp when the PO was created")
        LocalDateTime createdAt,

        @Schema(description = "Timestamp of the last update")
        LocalDateTime updatedAt

) {}
