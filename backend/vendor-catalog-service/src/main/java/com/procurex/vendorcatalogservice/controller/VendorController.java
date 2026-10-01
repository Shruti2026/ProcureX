package com.procurex.vendorcatalogservice.controller;

import com.procurex.vendorcatalogservice.dto.request.CreateVendorRequest;
import com.procurex.vendorcatalogservice.dto.request.UpdateVendorRequest;
import com.procurex.vendorcatalogservice.dto.response.ApiResponse;
import com.procurex.vendorcatalogservice.dto.response.VendorResponse;
import com.procurex.vendorcatalogservice.entity.VendorStatus;
import com.procurex.vendorcatalogservice.service.VendorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vendors")
@RequiredArgsConstructor
public class VendorController {

    private final VendorService vendorService;

    @PostMapping
    @PreAuthorize("hasAnyRole('PROCUREMENT_MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<VendorResponse>> createVendor(
            @Valid @RequestBody CreateVendorRequest request) {
        VendorResponse response = vendorService.createVendor(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Vendor created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('PROCUREMENT_MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Page<VendorResponse>>> getAllVendors(
            @PageableDefault(size = 20, sort = "companyName", direction = Sort.Direction.ASC) Pageable pageable,
            @RequestParam(required = false) VendorStatus status) {
        Page<VendorResponse> page = vendorService.getAllVendors(pageable, status);
        return ResponseEntity.ok(ApiResponse.success("Vendors retrieved successfully", page));
    }

    @GetMapping("/{vendorId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<VendorResponse>> getVendorById(
            @PathVariable UUID vendorId) {
        VendorResponse response = vendorService.getVendorById(vendorId);
        return ResponseEntity.ok(ApiResponse.success("Vendor retrieved successfully", response));
    }

    @PutMapping("/{vendorId}")
    @PreAuthorize("hasAnyRole('PROCUREMENT_MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<VendorResponse>> updateVendor(
            @PathVariable UUID vendorId,
            @Valid @RequestBody UpdateVendorRequest request) {
        VendorResponse response = vendorService.updateVendor(vendorId, request);
        return ResponseEntity.ok(ApiResponse.success("Vendor updated successfully", response));
    }
}
