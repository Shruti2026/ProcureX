package com.procurex.inventoryservice.service;

import com.procurex.inventoryservice.dto.response.InventoryResponse;
import com.procurex.inventoryservice.dto.response.StockTransactionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface InventoryService {

    Page<InventoryResponse> getStockLevels(UUID orgId, Pageable pageable);

    Page<StockTransactionResponse> getTransactions(UUID orgId, UUID productId, Pageable pageable);
}
