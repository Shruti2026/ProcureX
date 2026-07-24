package com.procurex.identityservice.service;

import com.procurex.identityservice.dto.request.LoginRequest;
import com.procurex.identityservice.dto.request.VendorRegisterRequest;
import com.procurex.identityservice.dto.response.LoginResponse;
import com.procurex.identityservice.dto.response.TokenRefreshResponse;
import com.procurex.identityservice.dto.response.VendorRegisterResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public interface AuthService {

    /**
     * Authenticates a user, issues access + refresh tokens.
     * Writes HttpOnly refresh cookie to the response.
     */
    LoginResponse login(LoginRequest request,
                        HttpServletRequest httpRequest,
                        HttpServletResponse httpResponse);

    /**
     * Public vendor self-registration.
     * Always assigns role = VENDOR and status = PENDING.
     * The vendor cannot log in until an admin approves their account.
     */
    VendorRegisterResponse registerVendor(VendorRegisterRequest request);

    /**
     * Validates the refresh token, rotates it, and returns a new access token.
     * Writes the new HttpOnly refresh cookie to the response.
     */
    TokenRefreshResponse refresh(String refreshToken, HttpServletResponse httpResponse);

    /**
     * Revokes the refresh token and clears the cookie.
     */
    void logout(String refreshToken, HttpServletResponse httpResponse);
}

