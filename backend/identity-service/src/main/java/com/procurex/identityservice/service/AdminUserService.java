package com.procurex.identityservice.service;

import com.procurex.identityservice.dto.request.CreateEmployeeRequest;
import com.procurex.identityservice.dto.response.UserRegisterResponse;

import java.util.List;
import java.util.UUID;

/**
 * Service for admin-only user management operations.
 * All methods require the caller to be an authenticated ADMIN.
 */
public interface AdminUserService {

    /**
     * Creates an internal employee (PROCUREMENT_MANAGER, INVENTORY_MANAGER, FINANCE_MANAGER).
     * The employee account is set to ACTIVE immediately.
     * A temporary password is auto-generated and returned in the response.
     *
     * @param request       Employee creation details
     * @param adminEmail    Email of the authenticated admin performing the action
     */
    UserRegisterResponse createEmployee(CreateEmployeeRequest request, String adminEmail);

    /**
     * Returns all vendor accounts currently in PENDING status.
     */
    List<UserRegisterResponse> getPendingVendors();

    /**
     * Approves a vendor account, setting its status to ACTIVE.
     *
     * @param vendorUserId  UUID of the vendor's user account
     * @param adminEmail    Email of the authenticated admin performing the action
     */
    UserRegisterResponse approveVendor(UUID vendorUserId, String adminEmail);

    /**
     * Rejects a vendor account, setting its status to REJECTED.
     *
     * @param vendorUserId  UUID of the vendor's user account
     * @param adminEmail    Email of the authenticated admin performing the action
     */
    UserRegisterResponse rejectVendor(UUID vendorUserId, String adminEmail);
}
