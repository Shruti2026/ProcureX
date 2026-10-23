package com.procurex.identityservice.dto.response;

/**
 * Summary metrics for the Admin Dashboard.
 */
public record AdminDashboardSummaryResponse(
        long totalUsers,
        long activeEmployees,
        long totalVendors,
        long activeVendors,
        long pendingVendors,
        long lockedAccounts
) {}
