package com.procurex.procurementservice.service;

import com.procurex.procurementservice.dto.request.CreateRequisitionRequest;
import com.procurex.procurementservice.dto.request.UpdateRequisitionRequest;
import com.procurex.procurementservice.dto.response.RequisitionResponse;
import com.procurex.procurementservice.entity.RequisitionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface RequisitionService {

    RequisitionResponse create(CreateRequisitionRequest request, UUID userId, UUID orgId);

    Page<RequisitionResponse> getAll(UUID orgId, RequisitionStatus status, Pageable pageable);

    RequisitionResponse getById(UUID requisitionId);

    RequisitionResponse update(UUID requisitionId, UpdateRequisitionRequest request, UUID userId);
}
