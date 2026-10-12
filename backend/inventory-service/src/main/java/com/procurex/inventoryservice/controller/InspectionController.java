package com.procurex.inventoryservice.controller;

import com.procurex.inventoryservice.dto.request.SubmitInspectionRequest;
import com.procurex.inventoryservice.dto.response.InspectionResponse;
import com.procurex.inventoryservice.service.InspectionService;
import com.procurex.inventoryservice.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory/inspections")
@RequiredArgsConstructor
public class InspectionController {

    private final InspectionService inspectionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<ApiResponse<InspectionResponse>> submitInspection(
            @Valid @RequestBody SubmitInspectionRequest request,
            Principal principal) {

        InspectionResponse response = inspectionService.submitInspection(request,
                (UsernamePasswordAuthenticationToken) principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Inspection submitted successfully", response));
    }

    @GetMapping("/grn/{grnId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<ApiResponse<InspectionResponse>> getByGrn(
            @PathVariable UUID grnId,
            Principal principal) {

        InspectionResponse response = inspectionService.getByGrn(grnId,
                (UsernamePasswordAuthenticationToken) principal);
        return ResponseEntity.ok(ApiResponse.success("Inspection retrieved successfully", response));
    }
}
