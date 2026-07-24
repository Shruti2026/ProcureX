package com.procurex.identityservice.controller;

import com.procurex.identityservice.dto.request.LoginRequest;
import com.procurex.identityservice.dto.request.VendorRegisterRequest;
import com.procurex.identityservice.dto.response.ApiResponse;
import com.procurex.identityservice.dto.response.LoginResponse;
import com.procurex.identityservice.dto.response.TokenRefreshResponse;
import com.procurex.identityservice.dto.response.VendorRegisterResponse;
import com.procurex.identityservice.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, token refresh, logout, and vendor registration endpoints")
public class AuthController {

    private final AuthService authService;

    // -------------------------------------------------------------------------
    // Login
    // -------------------------------------------------------------------------
    @Operation(summary = "User login", description = "Authenticates credentials and issues access + refresh tokens")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid credentials"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Account pending approval or rejected"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "423", description = "Account locked")
    })
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        LoginResponse loginResponse = authService.login(request, httpRequest, httpResponse);
        return ResponseEntity.ok(ApiResponse.success("Authentication successful", loginResponse));
    }

    // -------------------------------------------------------------------------
    // Vendor Self-Registration (Public)
    // -------------------------------------------------------------------------
    @Operation(
            summary = "Vendor self-registration",
            description = "Registers a new vendor. The account is created with status PENDING and must be approved "
                    + "by an administrator before the vendor can log in. The backend always assigns role=VENDOR."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Vendor registered, pending approval"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid payload"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Email already exists")
    })
    @PostMapping("/vendor/register")
    public ResponseEntity<ApiResponse<VendorRegisterResponse>> registerVendor(
            @Valid @RequestBody VendorRegisterRequest request) {

        VendorRegisterResponse response = authService.registerVendor(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Vendor registration submitted successfully", response));
    }

    // -------------------------------------------------------------------------
    // Refresh
    // -------------------------------------------------------------------------
    @Operation(summary = "Refresh access token",
               description = "Validates the HttpOnly refresh cookie and issues a rotated access token")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Token refreshed"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
    })
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenRefreshResponse>> refresh(
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            HttpServletResponse httpResponse) {

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Refresh token is missing"));
        }

        TokenRefreshResponse response = authService.refresh(refreshToken, httpResponse);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }

    // -------------------------------------------------------------------------
    // Logout
    // -------------------------------------------------------------------------
    @Operation(summary = "Logout", description = "Revokes the refresh token and clears the cookie")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            HttpServletResponse httpResponse) {

        if (refreshToken != null && !refreshToken.isBlank()) {
            authService.logout(refreshToken, httpResponse);
        }

        return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
    }
}
