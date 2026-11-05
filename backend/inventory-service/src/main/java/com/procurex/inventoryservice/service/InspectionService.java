package com.procurex.inventoryservice.service;

import com.procurex.inventoryservice.dto.request.SubmitInspectionRequest;
import com.procurex.inventoryservice.dto.response.InspectionResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.UUID;

public interface InspectionService {

    InspectionResponse submitInspection(SubmitInspectionRequest request, UsernamePasswordAuthenticationToken auth, HttpServletRequest httpRequest);

    InspectionResponse getByGrn(UUID grnId, UsernamePasswordAuthenticationToken auth);
}
