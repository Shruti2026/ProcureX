package com.procurex.identityservice.controller;

import com.procurex.identityservice.dto.request.CreateEmployeeRequest;
import com.procurex.identityservice.dto.request.UpdateStatusRequest;
import com.procurex.identityservice.dto.response.ApiResponse;
import com.procurex.identityservice.dto.response.AuditLogResponse;
import com.procurex.identityservice.dto.response.UserRegisterResponse;
import com.procurex.identityservice.service.AdminUserService;
import com.procurex.identityservice.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * REST endpoints for administrator-only user management operations,
 * including employee creation, vendor approval workflows, and audit log retrieval.
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Operations", description = "Admin-only user management and vendor approval endpoints")
public class AdminController {

    private final AdminUserService adminUserService;
    private final AuditLogService  auditLogService;

    // -------------------------------------------------------------------------
    // Create Employee
    // -------------------------------------------------------------------------
    @Operation(
            summary = "Create internal employee",
            description = "Creates a new internal employee (PROCUREMENT_MANAGER, INVENTORY_MANAGER, FINANCE_MANAGER) "
                    + "and sets status to ACTIVE immediately. A temporary password is returned in the response."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Employee created"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid payload or role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Admin role required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Email already exists")
    })
    @PostMapping("/users")
    public ResponseEntity<ApiResponse<UserRegisterResponse>> createEmployee(
            @Valid @RequestBody CreateEmployeeRequest request,
            Authentication authentication) {

        UserRegisterResponse response = adminUserService.createEmployee(request, authentication.getName());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Employee created successfully", response));
    }

    // -------------------------------------------------------------------------
    // List Pending Vendors
    // -------------------------------------------------------------------------
    @Operation(summary = "List pending vendors", description = "Retrieves all vendor accounts in PENDING status")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Success"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Admin role required")
    })
    @GetMapping("/vendors/pending")
    public ResponseEntity<ApiResponse<List<UserRegisterResponse>>> getPendingVendors() {
        List<UserRegisterResponse> response = adminUserService.getPendingVendors();
        return ResponseEntity.ok(ApiResponse.success("Pending vendors retrieved successfully", response));
    }

    // -------------------------------------------------------------------------
    // List All Vendors
    // -------------------------------------------------------------------------
    @Operation(summary = "List all vendors", description = "Retrieves all vendor accounts regardless of status")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Success"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Admin role required")
    })
    @GetMapping("/vendors")
    public ResponseEntity<ApiResponse<List<UserRegisterResponse>>> getAllVendors() {
        List<UserRegisterResponse> response = adminUserService.getAllVendors();
        return ResponseEntity.ok(ApiResponse.success("All vendors retrieved successfully", response));
    }

    // -------------------------------------------------------------------------
    // Approve Vendor
    // -------------------------------------------------------------------------
    @Operation(summary = "Approve vendor", description = "Approves a pending vendor account, changing status to ACTIVE")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Vendor approved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "User is not a vendor or is not in PENDING state"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Admin role required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Vendor not found")
    })
    @PutMapping("/vendors/{id}/approve")
    public ResponseEntity<ApiResponse<UserRegisterResponse>> approveVendor(
            @PathVariable("id") UUID vendorUserId,
            Authentication authentication) {

        UserRegisterResponse response = adminUserService.approveVendor(vendorUserId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Vendor approved successfully", response));
    }

    // -------------------------------------------------------------------------
    // Reject Vendor
    // -------------------------------------------------------------------------
    @Operation(summary = "Reject vendor", description = "Rejects a pending vendor account, changing status to REJECTED")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Vendor rejected successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "User is not a vendor or is not in PENDING state"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Admin role required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Vendor not found")
    })
    @PutMapping("/vendors/{id}/reject")
    public ResponseEntity<ApiResponse<UserRegisterResponse>> rejectVendor(
            @PathVariable("id") UUID vendorUserId,
            Authentication authentication) {

        UserRegisterResponse response = adminUserService.rejectVendor(vendorUserId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Vendor rejected successfully", response));
    }

    // -------------------------------------------------------------------------
    // Update User Status
    // -------------------------------------------------------------------------
    @Operation(summary = "Update user status", description = "Updates status for any user (active, inactive, locked, suspended, pending, rejected)")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User status updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Cannot change own status or invalid status"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Admin role required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    @PutMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<UserRegisterResponse>> updateUserStatus(
            @PathVariable("id") UUID userId,
            @Valid @RequestBody UpdateStatusRequest request,
            Authentication authentication) {

        UserRegisterResponse response = adminUserService.updateUserStatus(userId, request.status(), authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("User status updated successfully", response));
    }

    // -------------------------------------------------------------------------
    // List All Employees
    // -------------------------------------------------------------------------
    @Operation(summary = "List all internal employees", description = "Retrieves all employees with manager roles (procurement, inventory, finance)")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Success"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Admin role required")
    })
    @GetMapping("/users/employees")
    public ResponseEntity<ApiResponse<List<UserRegisterResponse>>> getAllEmployees() {
        List<UserRegisterResponse> response = adminUserService.getAllEmployees();
        return ResponseEntity.ok(ApiResponse.success("Internal employees retrieved successfully", response));
    }

    // -------------------------------------------------------------------------
    // Delete User
    // -------------------------------------------------------------------------
    @Operation(summary = "Delete user account", description = "Deletes a manager or vendor account and cascades refresh token removal")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User deleted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Cannot delete own account"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Admin role required"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable("id") UUID userId,
            Authentication authentication) {

        adminUserService.deleteUser(userId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }

    // -------------------------------------------------------------------------
    // Get Audit Logs
    // -------------------------------------------------------------------------
    @Operation(
            summary = "Get audit logs",
            description = "Returns a paginated, server-side filtered list of audit log entries. "
                    + "Supports filtering by action, userId, and date range. "
                    + "Default sort is createdAt descending."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Audit logs retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthenticated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Admin role required")
    })
    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> getAuditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) UUID   userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        // Clamp page size to prevent abuse
        int safeSize = Math.min(size, 100);

        PageRequest pageable = PageRequest.of(page, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<AuditLogResponse> result = auditLogService.getAuditLogs(action, userId, from, to, pageable);

        return ResponseEntity.ok(ApiResponse.success("Audit logs retrieved successfully", result));
    }
}
