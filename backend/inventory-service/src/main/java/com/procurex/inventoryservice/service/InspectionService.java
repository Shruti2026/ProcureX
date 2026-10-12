package com.procurex.inventoryservice.service;

import com.procurex.inventoryservice.dto.request.SubmitInspectionRequest;
import com.procurex.inventoryservice.dto.response.InspectionResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.UUID;

public interface InspectionService {

    InspectionResponse submitInspection(SubmitInspectionRequest request, UsernamePasswordAuthenticationToken auth);

    InspectionResponse getByGrn(UUID grnId, UsernamePasswordAuthenticationToken auth);
}
