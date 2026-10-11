package com.procurex.vendorcatalogservice.service.impl;

import com.procurex.vendorcatalogservice.dto.request.CreateVendorProductRequest;
import com.procurex.vendorcatalogservice.dto.request.UpdateVendorProductRequest;
import com.procurex.vendorcatalogservice.dto.response.VendorProductResponse;
import com.procurex.vendorcatalogservice.entity.MappingStatus;
import com.procurex.vendorcatalogservice.entity.Product;
import com.procurex.vendorcatalogservice.entity.Vendor;
import com.procurex.vendorcatalogservice.entity.VendorProduct;
import com.procurex.vendorcatalogservice.exception.ConflictException;
import com.procurex.vendorcatalogservice.exception.ResourceNotFoundException;
import com.procurex.vendorcatalogservice.repository.ProductRepository;
import com.procurex.vendorcatalogservice.repository.VendorProductRepository;
import com.procurex.vendorcatalogservice.repository.VendorRepository;
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
    private final VendorRepository vendorRepository;
    private final ProductRepository productRepository;

    @Override
    public VendorProductResponse create(CreateVendorProductRequest request, UUID orgId) {
        Vendor vendor = vendorRepository.findById(request.vendorId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Vendor not found with id: " + request.vendorId()));

        Product product = productRepository.findById(request.productId())
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Product not found with id: " + request.productId()));

        if (vendorProductRepository.existsByVendor_VendorIdAndProduct_ProductId(
                request.vendorId(), request.productId())) {
            throw new ConflictException("Vendor-product mapping already exists");
        }

        VendorProduct vendorProduct = VendorProduct.builder()
                .vendor(vendor)
                .product(product)
                .vendorPrice(request.vendorPrice())
                .minimumOrderQuantity(request.minimumOrderQuantity())
                .leadTimeDays(request.leadTimeDays())
                .mappingStatus(MappingStatus.ACTIVE)
                .build();

        VendorProduct saved = vendorProductRepository.save(vendorProduct);
        log.info("Created vendor-product mapping: vendor={}, product={}, id={}",
                vendor.getCompanyName(), product.getProductName(), saved.getVendorProductId());
        return toVendorProductResponse(saved);
    }

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
