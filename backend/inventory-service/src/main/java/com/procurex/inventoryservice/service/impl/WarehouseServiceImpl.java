package com.procurex.inventoryservice.service.impl;

import com.procurex.inventoryservice.dto.request.CreateWarehouseRequest;
import com.procurex.inventoryservice.dto.response.WarehouseResponse;
import com.procurex.inventoryservice.entity.Warehouse;
import com.procurex.inventoryservice.exception.ConflictException;
import com.procurex.inventoryservice.exception.ResourceNotFoundException;
import com.procurex.inventoryservice.repository.GoodsReceiptNoteRepository;
import com.procurex.inventoryservice.repository.WarehouseRepository;
import com.procurex.inventoryservice.service.WarehouseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final GoodsReceiptNoteRepository grnRepository;

    @Override
    @Transactional
    public WarehouseResponse create(CreateWarehouseRequest request, UUID orgId) {
        Warehouse warehouse = Warehouse.builder()
                .organizationId(orgId)
                .warehouseName(request.warehouseName())
                .location(request.location())
                .capacity(request.capacity())
                .build();

        warehouse = warehouseRepository.save(warehouse);
        log.debug("Created warehouse {} for org {}", warehouse.getWarehouseId(), orgId);
        return toResponse(warehouse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WarehouseResponse> getAll(UUID orgId) {
        return warehouseRepository.findByOrganizationId(orgId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public WarehouseResponse getById(UUID warehouseId, UUID orgId) {
        return warehouseRepository.findByWarehouseIdAndOrganizationId(warehouseId, orgId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Warehouse not found with id: " + warehouseId));
    }

    @Override
    @Transactional
    public WarehouseResponse update(UUID warehouseId, CreateWarehouseRequest request, UUID orgId) {
        Warehouse warehouse = warehouseRepository.findByWarehouseIdAndOrganizationId(warehouseId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Warehouse not found with id: " + warehouseId));

        warehouse.setWarehouseName(request.warehouseName());
        warehouse.setLocation(request.location());
        warehouse.setCapacity(request.capacity());

        warehouse = warehouseRepository.save(warehouse);
        return toResponse(warehouse);
    }

    @Override
    @Transactional
    public void delete(UUID warehouseId, UUID orgId) {
        Warehouse warehouse = warehouseRepository.findByWarehouseIdAndOrganizationId(warehouseId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Warehouse not found with id: " + warehouseId));

        // Check if any GRN references this warehouse
        boolean hasGrns = grnRepository.findByOrganizationId(orgId,
                        org.springframework.data.domain.Pageable.unpaged())
                .stream()
                .anyMatch(grn -> grn.getWarehouse().getWarehouseId().equals(warehouseId));

        if (hasGrns) {
            throw new ConflictException(
                    "Cannot delete warehouse with existing goods receipt notes");
        }

        warehouseRepository.delete(warehouse);
        log.debug("Deleted warehouse {} for org {}", warehouseId, orgId);
    }

    private WarehouseResponse toResponse(Warehouse w) {
        return new WarehouseResponse(
                w.getWarehouseId(),
                w.getWarehouseName(),
                w.getLocation(),
                w.getCapacity(),
                w.getCreatedAt()
        );
    }
}
