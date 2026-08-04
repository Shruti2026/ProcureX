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
     * @return UserRegisterResponse containing the new employee's details and temporary password
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
     * @return UserRegisterResponse containing the vendor's details
     */
    UserRegisterResponse approveVendor(UUID vendorUserId, String adminEmail);

    /**
     * Rejects a vendor account, setting its status to REJECTED.
     *
     * @param vendorUserId  UUID of the vendor's user account
     * @param adminEmail    Email of the authenticated admin performing the action
     * @return UserRegisterResponse containing the vendor's details
     */
    UserRegisterResponse rejectVendor(UUID vendorUserId, String adminEmail);

    /**
     * Updates a user's account status (e.g. deactivate, suspend, lock, unlock).
     *
     * @param userId      UUID of the user account
     * @param status      The target AccountStatus
     * @param adminEmail  Email of the authenticated admin performing the action
     * @return UserRegisterResponse containing the updated user's details
     */
    UserRegisterResponse updateUserStatus(UUID userId, com.procurex.identityservice.entity.AccountStatus status, String adminEmail);

    /**
     * Retrieves all internal employees (managers).
     *
     * @return List of UserRegisterResponse records representing internal employees
     */
    List<UserRegisterResponse> getAllEmployees();

    /**
     * Retrieves all vendor accounts regardless of their status.
     *
     * @return List of UserRegisterResponse records representing all vendors
     */
    List<UserRegisterResponse> getAllVendors();

    /**
     * Deletes a user (manager or vendor) and removes associated refresh tokens.
     *
     * @param userId      UUID of the user to delete
     * @param adminEmail  Email of the authenticated admin performing the action
     */
    void deleteUser(UUID userId, String adminEmail);
}
