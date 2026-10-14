package com.procurex.financeservice.dto.response;

import java.util.List;

public record MatchResult(
        boolean passed,
        List<MatchFlag> flags
) {}
