package com.procurex.inventoryservice.service;

import com.procurex.inventoryservice.dto.request.CreateWarehouseRequest;
import com.procurex.inventoryservice.dto.response.WarehouseResponse;

import java.util.List;
import java.util.UUID;

public interface WarehouseService {

    WarehouseResponse create(CreateWarehouseRequest request, UUID orgId);

    List<WarehouseResponse> getAll(UUID orgId);

    WarehouseResponse getById(UUID warehouseId, UUID orgId);

    WarehouseResponse update(UUID warehouseId, CreateWarehouseRequest request, UUID orgId);

    void delete(UUID warehouseId, UUID orgId);
}
