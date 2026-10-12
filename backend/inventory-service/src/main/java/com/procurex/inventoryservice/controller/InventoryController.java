package com.procurex.inventoryservice.controller;

import com.procurex.inventoryservice.dto.response.InventoryResponse;
import com.procurex.inventoryservice.dto.response.StockTransactionResponse;
import com.procurex.inventoryservice.service.InventoryService;
import com.procurex.inventoryservice.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER', 'PROCUREMENT_MANAGER')")
    public ResponseEntity<ApiResponse<Page<InventoryResponse>>> getStockLevels(
            @RequestHeader("X-Organization-Id") String orgId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<InventoryResponse> result = inventoryService.getStockLevels(UUID.fromString(orgId), pageable);
        return ResponseEntity.ok(ApiResponse.success("Stock levels retrieved successfully", result));
    }

    @GetMapping("/stock-transactions")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    public ResponseEntity<ApiResponse<Page<StockTransactionResponse>>> getTransactions(
            @RequestHeader("X-Organization-Id") String orgId,
            @RequestParam(required = false) UUID productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<StockTransactionResponse> result = inventoryService.getTransactions(
                UUID.fromString(orgId), productId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Stock transactions retrieved successfully", result));
    }
}
