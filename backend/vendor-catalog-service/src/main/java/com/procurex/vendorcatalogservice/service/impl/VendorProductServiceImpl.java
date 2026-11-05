package com.procurex.vendorcatalogservice.service.impl;

import com.procurex.vendorcatalogservice.dto.request.UpdateVendorProductRequest;
import com.procurex.vendorcatalogservice.dto.response.VendorProductResponse;
import com.procurex.vendorcatalogservice.entity.VendorProduct;
import com.procurex.vendorcatalogservice.exception.ResourceNotFoundException;
import com.procurex.vendorcatalogservice.repository.VendorProductRepository;
import com.procurex.vendorcatalogservice.service.VendorProductService;
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
@Transactional
public class VendorProductServiceImpl implements VendorProductService {

    private final VendorProductRepository vendorProductRepository;

    @Override
    @Transactional(readOnly = true)
    public List<VendorProductResponse> getByVendor(UUID vendorId, UUID orgId) {
        return vendorProductRepository.findByVendor_VendorIdAndIsDeletedFalse(vendorId)
                .stream()
                .map(this::toVendorProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VendorProductResponse> getByProduct(UUID productId, UUID orgId) {
        return vendorProductRepository.findByProduct_ProductIdAndIsDeletedFalse(productId)
                .stream()
                .map(this::toVendorProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    public VendorProductResponse update(UUID vendorProductId, UpdateVendorProductRequest request, UUID orgId) {
        VendorProduct vendorProduct = vendorProductRepository.findByVendorProductId(vendorProductId)
                .filter(vp -> !vp.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Vendor-product mapping not found with id: " + vendorProductId));

        vendorProduct.setVendorPrice(request.vendorPrice());
        vendorProduct.setMinimumOrderQuantity(request.minimumOrderQuantity());
        vendorProduct.setLeadTimeDays(request.leadTimeDays());
        if (request.status() != null) {
            vendorProduct.setMappingStatus(request.status());
        }

        VendorProduct saved = vendorProductRepository.save(vendorProduct);
        log.info("Updated vendor-product mapping id={}", saved.getVendorProductId());
        return toVendorProductResponse(saved);
    }

    private VendorProductResponse toVendorProductResponse(VendorProduct vp) {
        return new VendorProductResponse(
                vp.getVendorProductId(),
                vp.getVendor().getVendorId(),
                vp.getVendor().getCompanyName(),
                vp.getProduct().getProductId(),
                vp.getProduct().getProductName(),
                vp.getProduct().getUnitOfMeasure(),
                vp.getVendorPrice(),
                vp.getMinimumOrderQuantity(),
                vp.getLeadTimeDays(),
                vp.getMappingStatus(),
                vp.getCreatedAt(),
                vp.getUpdatedAt()
        );
    }
}
