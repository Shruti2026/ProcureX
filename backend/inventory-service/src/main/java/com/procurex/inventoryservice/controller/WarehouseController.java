package com.procurex.inventoryservice.controller;

import com.procurex.inventoryservice.dto.request.CreateWarehouseRequest;
import com.procurex.inventoryservice.dto.response.WarehouseResponse;
import com.procurex.inventoryservice.service.WarehouseService;
import com.procurex.inventoryservice.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService warehouseService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<ApiResponse<WarehouseResponse>> create(
            @Valid @RequestBody CreateWarehouseRequest request,
            @RequestHeader("X-Organization-Id") String orgId) {

        WarehouseResponse response = warehouseService.create(request, UUID.fromString(orgId));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Warehouse created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT_MANAGER')")
    public ResponseEntity<ApiResponse<List<WarehouseResponse>>> getAll(
            @RequestHeader("X-Organization-Id") String orgId) {

        List<WarehouseResponse> warehouses = warehouseService.getAll(UUID.fromString(orgId));
        return ResponseEntity.ok(ApiResponse.success("Warehouses retrieved successfully", warehouses));
    }

    @GetMapping("/{warehouseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<ApiResponse<WarehouseResponse>> getById(
            @PathVariable UUID warehouseId,
            @RequestHeader("X-Organization-Id") String orgId) {

        WarehouseResponse response = warehouseService.getById(warehouseId, UUID.fromString(orgId));
        return ResponseEntity.ok(ApiResponse.success("Warehouse retrieved successfully", response));
    }

    @PutMapping("/{warehouseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<ApiResponse<WarehouseResponse>> update(
            @PathVariable UUID warehouseId,
            @Valid @RequestBody CreateWarehouseRequest request,
            @RequestHeader("X-Organization-Id") String orgId) {

        WarehouseResponse response = warehouseService.update(warehouseId, request, UUID.fromString(orgId));
        return ResponseEntity.ok(ApiResponse.success("Warehouse updated successfully", response));
    }

    @DeleteMapping("/{warehouseId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable UUID warehouseId,
            @RequestHeader("X-Organization-Id") String orgId) {

        warehouseService.delete(warehouseId, UUID.fromString(orgId));
        return ResponseEntity.noContent().build();
    }
}
