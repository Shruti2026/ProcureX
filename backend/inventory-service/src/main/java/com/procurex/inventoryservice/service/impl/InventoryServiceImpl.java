package com.procurex.inventoryservice.service.impl;

import com.procurex.inventoryservice.dto.response.InventoryResponse;
import com.procurex.inventoryservice.dto.response.StockTransactionResponse;
import com.procurex.inventoryservice.entity.Inventory;
import com.procurex.inventoryservice.entity.StockTransaction;
import com.procurex.inventoryservice.repository.InventoryRepository;
import com.procurex.inventoryservice.repository.StockTransactionRepository;
import com.procurex.inventoryservice.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final StockTransactionRepository stockTransactionRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryResponse> getStockLevels(UUID orgId, Pageable pageable) {
        return inventoryRepository.findByOrganizationId(orgId, pageable)
                .map(this::toInventoryResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<StockTransactionResponse> getTransactions(UUID orgId, UUID productId, Pageable pageable) {
        Page<StockTransaction> page = productId == null
                ? stockTransactionRepository.findByOrganizationIdOrderByTransactionAtDesc(orgId, pageable)
                : stockTransactionRepository.findByOrganizationIdAndProductIdOrderByTransactionAtDesc(
                        orgId, productId, pageable);
        return page.map(this::toTransactionResponse);
    }

    private InventoryResponse toInventoryResponse(Inventory inv) {
        return new InventoryResponse(
                inv.getInventoryId(),
                inv.getProductId(),
                inv.getWarehouse().getWarehouseId(),
                inv.getWarehouse().getWarehouseName(),
                inv.getQuantityOnHand(),
                inv.getQuantityReserved()
        );
    }

    private StockTransactionResponse toTransactionResponse(StockTransaction tx) {
        return new StockTransactionResponse(
                tx.getTransactionId(),
                tx.getProductId(),
                tx.getWarehouse().getWarehouseId(),
                tx.getTransactionType(),
                tx.getQuantity(),
                tx.getReferenceId(),
                tx.getReferenceType(),
                tx.getRemarks(),
                tx.getTransactionAt()
        );
    }
}
