package com.procurex.identityservice.controller;

import com.procurex.identityservice.dto.request.CreateEmployeeRequest;
import com.procurex.identityservice.dto.response.ApiResponse;
import com.procurex.identityservice.dto.response.UserRegisterResponse;
import com.procurex.identityservice.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Operations", description = "Admin-only user management and vendor approval endpoints")
public class AdminController {

    private final AdminUserService adminUserService;

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
}
