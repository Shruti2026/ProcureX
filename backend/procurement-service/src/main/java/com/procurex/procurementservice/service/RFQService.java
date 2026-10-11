package com.procurex.procurementservice.service;

import com.procurex.procurementservice.dto.request.CreateRFQRequest;
import com.procurex.procurementservice.dto.response.RFQResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface RFQService {

    RFQResponse create(CreateRFQRequest request, UUID organizationId, UUID userId);

    Page<RFQResponse> getAll(UUID organizationId, String status, Pageable pageable);

    RFQResponse getById(UUID rfqId, UUID organizationId);

    Page<RFQResponse> getMyInvitations(UUID vendorId, Pageable pageable);

    RFQResponse close(UUID rfqId, UUID organizationId, UUID userId);
}
