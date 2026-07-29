package com.procurex.identityservice.service;

import com.procurex.identityservice.dto.request.ChangePasswordRequest;
import com.procurex.identityservice.dto.request.LoginRequest;
import com.procurex.identityservice.dto.request.VendorRegisterRequest;
import com.procurex.identityservice.dto.response.LoginResponse;
import com.procurex.identityservice.dto.response.TokenRefreshResponse;
import com.procurex.identityservice.dto.response.VendorRegisterResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Service responsible for user authentication, vendor self-registration,
 * JWT refresh token management, and logout operations.
 */
public interface AuthService {

    /**
     * Authenticates a user, issues access and refresh tokens.
     * Writes an HttpOnly refresh cookie to the response.
     *
     * @param request login credentials
     * @param httpRequest current HTTP request
     * @param httpResponse HTTP response used to write the refresh cookie
     * @return authenticated user details and access token
     */
    LoginResponse login(LoginRequest request,
                        HttpServletRequest httpRequest,
                        HttpServletResponse httpResponse);

    /**
     * Public vendor self-registration.
     * Always assigns role = VENDOR and status = PENDING.
     * The vendor cannot log in until an admin approves their account.
     * 
     * @param request vendor registration details
     * @return VendorRegisterResponse containing the new vendor's details
     */
    VendorRegisterResponse registerVendor(VendorRegisterRequest request);

    /**
     * Validates the refresh token, rotates it, and returns a new access token.
     * Writes the new HttpOnly refresh cookie to the response.
     * 
     * @param refreshToken the refresh token from the HttpOnly cookie
     * @param httpResponse HTTP response used to write the new refresh cookie
     * @return TokenRefreshResponse containing the new access token and its expiry
     */
    TokenRefreshResponse refresh(String refreshToken, HttpServletResponse httpResponse);

    /**
     * Revokes the refresh token and clears the cookie.
     * 
     * @param refreshToken the refresh token from the HttpOnly cookie
     * @param httpResponse HTTP response used to clear the refresh cookie
     */
    void logout(String refreshToken, HttpServletResponse httpResponse);

    /**
     * Changes user password.
     * 
     * @param email current logged-in user email
     * @param request change password details
     */
    void changePassword(String email, ChangePasswordRequest request);
}

