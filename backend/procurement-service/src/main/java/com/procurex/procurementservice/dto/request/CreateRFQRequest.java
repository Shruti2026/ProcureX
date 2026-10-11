package com.procurex.procurementservice.dto.request;

import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateRFQRequest(
        @NotNull UUID requisitionId,
        @NotNull @Future LocalDate closingDate,
        @NotEmpty @Size(min = 1, max = 20) List<@NotNull UUID> invitedVendorIds
) {}
