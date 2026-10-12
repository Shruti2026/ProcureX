package com.procurex.inventoryservice.controller;

import com.procurex.inventoryservice.dto.request.CreateGrnRequest;
import com.procurex.inventoryservice.dto.response.GrnResponse;
import com.procurex.inventoryservice.enums.GrnStatus;
import com.procurex.inventoryservice.service.GRNService;
import com.procurex.inventoryservice.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory/grns")
@RequiredArgsConstructor
public class GRNController {

    private final GRNService grnService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<ApiResponse<GrnResponse>> create(
            @Valid @RequestBody CreateGrnRequest request,
            Principal principal) {

        GrnResponse response = grnService.create(request,
                (UsernamePasswordAuthenticationToken) principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("GRN created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT_MANAGER')")
    public ResponseEntity<ApiResponse<Page<GrnResponse>>> getAll(
            @RequestHeader("X-Organization-Id") String orgId,
            @RequestParam(required = false) GrnStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<GrnResponse> result = grnService.getAll(UUID.fromString(orgId), status, pageable);
        return ResponseEntity.ok(ApiResponse.success("GRNs retrieved successfully", result));
    }

    @GetMapping("/{grnId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT_MANAGER')")
    public ResponseEntity<ApiResponse<GrnResponse>> getById(
            @PathVariable UUID grnId,
            @RequestHeader("X-Organization-Id") String orgId) {

        GrnResponse response = grnService.getById(grnId, UUID.fromString(orgId));
        return ResponseEntity.ok(ApiResponse.success("GRN retrieved successfully", response));
    }
}
