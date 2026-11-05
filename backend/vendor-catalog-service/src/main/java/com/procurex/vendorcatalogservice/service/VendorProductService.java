package com.procurex.vendorcatalogservice.service;

import com.procurex.vendorcatalogservice.dto.request.UpdateVendorProductRequest;
import com.procurex.vendorcatalogservice.dto.response.VendorProductResponse;

import java.util.List;
import java.util.UUID;

public interface VendorProductService {

    List<VendorProductResponse> getByVendor(UUID vendorId, UUID orgId);

    List<VendorProductResponse> getByProduct(UUID productId, UUID orgId);

    VendorProductResponse update(UUID vendorProductId, UpdateVendorProductRequest request, UUID orgId);
}
