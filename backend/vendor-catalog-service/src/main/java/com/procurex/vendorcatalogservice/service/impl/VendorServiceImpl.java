package com.procurex.vendorcatalogservice.service.impl;

import com.procurex.vendorcatalogservice.dto.request.CreateVendorRequest;
import com.procurex.vendorcatalogservice.dto.request.UpdateVendorRequest;
import com.procurex.vendorcatalogservice.dto.response.VendorResponse;
import com.procurex.vendorcatalogservice.entity.Vendor;
import com.procurex.vendorcatalogservice.entity.VendorStatus;
import com.procurex.vendorcatalogservice.exception.ConflictException;
import com.procurex.vendorcatalogservice.exception.ResourceNotFoundException;
import com.procurex.vendorcatalogservice.repository.VendorRepository;
import com.procurex.vendorcatalogservice.service.VendorService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class VendorServiceImpl implements VendorService {

    private final VendorRepository vendorRepository;
    private final HttpServletRequest httpServletRequest;

    @Override
    public VendorResponse createVendor(CreateVendorRequest request) {
        // Check for duplicate GST number
        if (StringUtils.hasText(request.gstNumber())) {
            vendorRepository.findByGstNumber(request.gstNumber())
                    .ifPresent(v -> {
                        throw new ConflictException(
                                "A vendor with GST number '" + request.gstNumber() + "' already exists.");
                    });
        }

        // Resolve organizationId from request header
        String orgIdHeader = httpServletRequest.getHeader("X-Organization-Id");
        UUID organizationId = StringUtils.hasText(orgIdHeader)
                ? UUID.fromString(orgIdHeader)
                : null;

        Vendor vendor = Vendor.builder()
                .organizationId(organizationId)
                .companyName(request.companyName())
                .contactPerson(request.contactPerson())
                .email(request.email())
                .phoneNumber(request.phoneNumber())
                .address(request.address())
                .city(request.city())
                .state(request.state())
                .country(request.country())
                .postalCode(request.postalCode())
                .gstNumber(request.gstNumber())
                .vendorStatus(VendorStatus.INACTIVE)
                .build();

        Vendor saved = vendorRepository.save(vendor);
        log.info("Created vendor '{}' with id {}", saved.getCompanyName(), saved.getVendorId());
        return toResponse(saved);
    }

    @Override
    public VendorResponse updateVendor(UUID vendorId, UpdateVendorRequest request) {
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Vendor not found with id: " + vendorId));

        if (StringUtils.hasText(request.companyName()))   vendor.setCompanyName(request.companyName());
        if (StringUtils.hasText(request.contactPerson())) vendor.setContactPerson(request.contactPerson());
        if (StringUtils.hasText(request.email()))         vendor.setEmail(request.email());
        if (StringUtils.hasText(request.phoneNumber()))   vendor.setPhoneNumber(request.phoneNumber());
        if (StringUtils.hasText(request.address()))       vendor.setAddress(request.address());
        if (StringUtils.hasText(request.city()))          vendor.setCity(request.city());
        if (StringUtils.hasText(request.state()))         vendor.setState(request.state());
        if (StringUtils.hasText(request.country()))       vendor.setCountry(request.country());
        if (StringUtils.hasText(request.postalCode()))    vendor.setPostalCode(request.postalCode());
        if (StringUtils.hasText(request.gstNumber()))     vendor.setGstNumber(request.gstNumber());

        Vendor saved = vendorRepository.save(vendor);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public VendorResponse getVendorById(UUID vendorId) {
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Vendor not found with id: " + vendorId));
        return toResponse(vendor);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<VendorResponse> getAllVendors(Pageable pageable, VendorStatus status) {
        if (status != null) {
            return vendorRepository.findAllByIsDeletedFalseAndVendorStatus(status, pageable)
                    .map(this::toResponse);
        }
        return vendorRepository.findAllByIsDeletedFalse(pageable)
                .map(this::toResponse);
    }

    private VendorResponse toResponse(Vendor v) {
        return new VendorResponse(
                v.getVendorId(),
                v.getOrganizationId(),
                v.getUserId(),
                v.getCompanyName(),
                v.getContactPerson(),
                v.getPhoneNumber(),
                v.getAddress(),
                v.getCity(),
                v.getState(),
                v.getCountry(),
                v.getPostalCode(),
                v.getGstNumber(),
                v.getVendorStatus(),
                v.getRating(),
                v.getCreatedAt(),
                v.getUpdatedAt()
        );
    }
}
