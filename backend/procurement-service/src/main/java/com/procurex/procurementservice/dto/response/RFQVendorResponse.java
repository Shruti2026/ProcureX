package com.procurex.procurementservice.dto.response;

import com.procurex.procurementservice.entity.InvitationStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.UUID;

@Schema(description = "A vendor invited to respond to an RFQ")
public record RFQVendorResponse(

        @Schema(description = "Unique identifier of this RFQ-vendor association")
        UUID rfqVendorId,

        @Schema(description = "Vendor's user ID")
        UUID vendorId,

        @Schema(description = "Vendor company name", example = "Acme Supplies Pvt. Ltd.")
        String companyName,

        @Schema(description = "Current invitation status", example = "SENT",
                allowableValues = {"SENT", "VIEWED", "RESPONDED"})
        InvitationStatus invitationStatus,

        @Schema(description = "Timestamp when the vendor was invited")
        LocalDateTime createdAt

) {}
