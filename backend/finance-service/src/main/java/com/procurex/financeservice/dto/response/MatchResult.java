package com.procurex.financeservice.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Result of running the 3-way match (Invoice vs PO vs GRN Inspection)")
public record MatchResult(

        @Schema(description = "True if all line items passed quantity and price checks, false if any discrepancies were found")
        boolean passed,

        @Schema(description = "List of discrepancies found during matching (empty if passed=true)")
        List<MatchFlag> flags

) {}
