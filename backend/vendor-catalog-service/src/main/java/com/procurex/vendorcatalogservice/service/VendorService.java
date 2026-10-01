package com.procurex.vendorcatalogservice.service;

import com.procurex.vendorcatalogservice.dto.request.CreateVendorRequest;
import com.procurex.vendorcatalogservice.dto.request.UpdateVendorRequest;
import com.procurex.vendorcatalogservice.dto.response.VendorResponse;
import com.procurex.vendorcatalogservice.entity.VendorStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface VendorService {

    VendorResponse createVendor(CreateVendorRequest request);

    VendorResponse updateVendor(UUID vendorId, UpdateVendorRequest request);

    VendorResponse getVendorById(UUID vendorId);

    Page<VendorResponse> getAllVendors(Pageable pageable, VendorStatus status);
}
