package com.procurex.vendorcatalogservice.controller;

import com.procurex.vendorcatalogservice.dto.request.CreateVendorProductRequest;
import com.procurex.vendorcatalogservice.dto.request.UpdateVendorProductRequest;
import com.procurex.vendorcatalogservice.dto.response.ApiResponse;
import com.procurex.vendorcatalogservice.dto.response.VendorProductResponse;
import com.procurex.vendorcatalogservice.service.VendorProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/vendor-products")
@RequiredArgsConstructor
public class VendorProductController {

    private final VendorProductService vendorProductService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROCUREMENT_MANAGER')")
    public ResponseEntity<ApiResponse<VendorProductResponse>> createVendorProduct(
            @Valid @RequestBody CreateVendorProductRequest request,
            @RequestHeader("X-Organization-Id") String orgId) {
        VendorProductResponse response = vendorProductService.create(request, UUID.fromString(orgId));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Vendor-product mapping created successfully", response));
    }

    @GetMapping("/vendor/{vendorId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROCUREMENT_MANAGER', 'VENDOR')")
    public ResponseEntity<ApiResponse<List<VendorProductResponse>>> getByVendor(
            @PathVariable UUID vendorId,
            @RequestHeader("X-Organization-Id") String orgId) {
        List<VendorProductResponse> responses = vendorProductService.getByVendor(vendorId, UUID.fromString(orgId));
        return ResponseEntity.ok(ApiResponse.success("Vendor products retrieved successfully", responses));
    }

    @GetMapping("/product/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROCUREMENT_MANAGER')")
    public ResponseEntity<ApiResponse<List<VendorProductResponse>>> getByProduct(
            @PathVariable UUID productId,
            @RequestHeader("X-Organization-Id") String orgId) {
        List<VendorProductResponse> responses = vendorProductService.getByProduct(productId, UUID.fromString(orgId));
        return ResponseEntity.ok(ApiResponse.success("Product vendors retrieved successfully", responses));
    }

    @PutMapping("/{vendorProductId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROCUREMENT_MANAGER')")
    public ResponseEntity<ApiResponse<VendorProductResponse>> updateVendorProduct(
            @PathVariable UUID vendorProductId,
            @Valid @RequestBody UpdateVendorProductRequest request,
            @RequestHeader("X-Organization-Id") String orgId) {
        VendorProductResponse response = vendorProductService.update(vendorProductId, request, UUID.fromString(orgId));
        return ResponseEntity.ok(ApiResponse.success("Vendor-product mapping updated successfully", response));
    }
}
