package com.procurex.identityservice.service;

import com.procurex.identityservice.dto.request.BootstrapAdminRequest;
import com.procurex.identityservice.dto.response.UserRegisterResponse;

/**
 * Service responsible for bootstrapping the initial administrator
 * account during system initialization.
 */
public interface BootstrapService {
    /**
     * Creates the initial administrator account during application bootstrap.
     *
     * @param request bootstrap administrator details
     * @return the created administrator account
     */
    UserRegisterResponse createInitialAdmin(BootstrapAdminRequest request);
}
