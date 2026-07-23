package com.procurex.identityservice.service;

import com.procurex.identityservice.dto.request.BootstrapAdminRequest;
import com.procurex.identityservice.dto.response.UserRegisterResponse;

public interface BootstrapService {
    UserRegisterResponse createInitialAdmin(BootstrapAdminRequest request);
}
