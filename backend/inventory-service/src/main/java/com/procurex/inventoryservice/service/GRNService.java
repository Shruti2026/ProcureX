package com.procurex.inventoryservice.service;

import com.procurex.inventoryservice.dto.request.CreateGrnRequest;
import com.procurex.inventoryservice.dto.response.GrnResponse;
import com.procurex.inventoryservice.enums.GrnStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.UUID;

public interface GRNService {

    GrnResponse create(CreateGrnRequest request, UsernamePasswordAuthenticationToken auth);

    Page<GrnResponse> getAll(UUID orgId, GrnStatus status, Pageable pageable);

    GrnResponse getById(UUID grnId, UUID orgId);
}
