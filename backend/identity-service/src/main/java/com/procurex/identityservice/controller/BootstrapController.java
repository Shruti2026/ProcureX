package com.procurex.identityservice.controller;

import com.procurex.identityservice.dto.request.BootstrapAdminRequest;
import com.procurex.identityservice.dto.response.ApiResponse;
import com.procurex.identityservice.dto.response.UserRegisterResponse;
import com.procurex.identityservice.service.BootstrapService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/bootstrap")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "procurex.bootstrap.enabled", havingValue = "true")
public class BootstrapController {

    private final BootstrapService bootstrapService;

    @PostMapping("/admin")
    public ResponseEntity<ApiResponse<UserRegisterResponse>> createAdmin(
            @Valid @RequestBody BootstrapAdminRequest request) {

        UserRegisterResponse response = bootstrapService.createInitialAdmin(request);
        return ResponseEntity.ok(ApiResponse.success("Initial admin created successfully", response));
    }
}
