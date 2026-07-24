package com.procurex.identityservice.service.impl;

import com.procurex.identityservice.config.JwtUtil;
import com.procurex.identityservice.dto.request.LoginRequest;
import com.procurex.identityservice.dto.request.VendorRegisterRequest;
import com.procurex.identityservice.dto.response.LoginResponse;
import com.procurex.identityservice.dto.response.TokenRefreshResponse;
import com.procurex.identityservice.dto.response.VendorRegisterResponse;
import com.procurex.identityservice.entity.AccountStatus;
import com.procurex.identityservice.entity.AuditLog;
import com.procurex.identityservice.entity.RefreshToken;
import com.procurex.identityservice.entity.Role;
import com.procurex.identityservice.entity.RoleName;
import com.procurex.identityservice.entity.User;
import com.procurex.identityservice.exception.AccountInactiveException;
import com.procurex.identityservice.exception.AccountLockedException;
import com.procurex.identityservice.exception.AccountPendingException;
import com.procurex.identityservice.exception.AccountRejectedException;
import com.procurex.identityservice.exception.ConflictException;
import com.procurex.identityservice.exception.InvalidTokenException;
import com.procurex.identityservice.repository.AuditLogRepository;
import com.procurex.identityservice.repository.RefreshTokenRepository;
import com.procurex.identityservice.repository.RoleRepository;
import com.procurex.identityservice.repository.UserRepository;
import com.procurex.identityservice.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private static final int    MAX_FAILED_ATTEMPTS     = 5;
    private static final String REFRESH_COOKIE_NAME     = "refreshToken";
    private static final int    ACCESS_TOKEN_EXPIRY_SEC = 900;

    private final UserRepository         userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuditLogRepository     auditLogRepository;
    private final RoleRepository         roleRepository;
    private final JwtUtil                jwtUtil;
    private final PasswordEncoder        passwordEncoder;

    @Value("${jwt.refresh-token-expiry}")
    private long refreshTokenExpiryMs;

    // -------------------------------------------------------------------------
    // Vendor Register
    // -------------------------------------------------------------------------
    @Override
    @Transactional
    public VendorRegisterResponse registerVendor(VendorRegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("A user with this email already exists");
        }

        Role vendorRole = roleRepository.findByRoleName(RoleName.VENDOR)
                .orElseThrow(() -> new IllegalStateException("VENDOR role not found in database"));

        // Each vendor gets their own auto-generated organization UUID.
        UUID vendorOrgId = UUID.randomUUID();

        User user = User.builder()
                .organizationId(vendorOrgId)
                .fullName(request.contactPerson())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .phoneNumber(request.phone())
                .role(vendorRole)
                .accountStatus(AccountStatus.PENDING)
                .failedLoginAttempts(0)
                .build();

        User saved = userRepository.save(user);

        // Write audit log — no external creator, so we use the vendor's own userId
        writeAuditLog(saved, "VENDOR_REGISTER", "users", saved.getUserId().toString(), null);

        log.info("Vendor registered: userId={}, email={}, status=PENDING",
                saved.getUserId(), saved.getEmail());

        return new VendorRegisterResponse(
                saved.getUserId(),
                saved.getEmail(),
                request.companyName(),
                saved.getAccountStatus(),
                "Registration successful. Your account is pending administrator approval."
        );
    }

    // -------------------------------------------------------------------------
    // Login
    // -------------------------------------------------------------------------
    @Override
    @Transactional
    public LoginResponse login(LoginRequest request,
                               HttpServletRequest httpRequest,
                               HttpServletResponse httpResponse) {

        // 1. Find user by email
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        // 2. Check account status — ordered from most specific to least
        if (user.getAccountStatus() == AccountStatus.LOCKED) {
            throw new AccountLockedException("Account is locked due to too many failed login attempts");
        }
        if (user.getAccountStatus() == AccountStatus.PENDING) {
            throw new AccountPendingException("Account is pending administrator approval");
        }
        if (user.getAccountStatus() == AccountStatus.REJECTED) {
            throw new AccountRejectedException("Account registration has been rejected");
        }
        if (user.getAccountStatus() == AccountStatus.INACTIVE) {
            throw new AccountInactiveException("Account is not yet activated");
        }

        // 3. Verify password
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);

            if (attempts >= MAX_FAILED_ATTEMPTS) {
                user.setAccountStatus(AccountStatus.LOCKED);
                log.warn("Account locked for user {} after {} failed attempts", user.getEmail(), attempts);
            }

            userRepository.save(user);
            throw new BadCredentialsException("Invalid email or password");
        }

        // 4. Reset failed attempts, update last login
        user.setFailedLoginAttempts(0);
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        // 5. Generate tokens
        String accessToken  = jwtUtil.generateAccessToken(user);
        String refreshToken = jwtUtil.generateRefreshToken();

        // 6. Persist refresh token (replace existing if any)
        refreshTokenRepository.findByUser(user).ifPresent(refreshTokenRepository::delete);
        refreshTokenRepository.flush();

        RefreshToken tokenEntity = RefreshToken.builder()
                .user(user)
                .token(refreshToken)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiryMs / 1000))
                .revoked(false)
                .build();
        refreshTokenRepository.save(tokenEntity);

        // 7. Write audit log
        writeAuditLog(user, "LOGIN", "users", user.getUserId().toString(), httpRequest);

        // 8. Set HttpOnly refresh cookie
        addRefreshCookie(httpResponse, refreshToken);

        return new LoginResponse(
                accessToken,
                ACCESS_TOKEN_EXPIRY_SEC,
                user.getUserId(),
                user.getRole().getRoleName().name(),
                user.getOrganizationId()
        );
    }

    // -------------------------------------------------------------------------
    // Refresh
    // -------------------------------------------------------------------------
    @Override
    @Transactional
    public TokenRefreshResponse refresh(String refreshToken, HttpServletResponse httpResponse) {
        RefreshToken tokenEntity = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));

        if (tokenEntity.isRevoked()) {
            throw new InvalidTokenException("Refresh token has been revoked");
        }

        if (tokenEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Refresh token has expired");
        }

        User user = tokenEntity.getUser();

        // Rotate: revoke old, issue new
        tokenEntity.setRevoked(true);
        refreshTokenRepository.save(tokenEntity);

        String newRefreshToken = jwtUtil.generateRefreshToken();
        String newAccessToken  = jwtUtil.generateAccessToken(user);

        RefreshToken newTokenEntity = RefreshToken.builder()
                .user(user)
                .token(newRefreshToken)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiryMs / 1000))
                .revoked(false)
                .build();
        refreshTokenRepository.save(newTokenEntity);

        addRefreshCookie(httpResponse, newRefreshToken);

        return new TokenRefreshResponse(newAccessToken, ACCESS_TOKEN_EXPIRY_SEC);
    }

    // -------------------------------------------------------------------------
    // Logout
    // -------------------------------------------------------------------------
    @Override
    @Transactional
    public void logout(String refreshToken, HttpServletResponse httpResponse) {
        refreshTokenRepository.findByToken(refreshToken).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });

        clearRefreshCookie(httpResponse);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    private void addRefreshCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);          // set to true in production (HTTPS)
        cookie.setPath("/api/v1/auth");
        cookie.setMaxAge((int) (refreshTokenExpiryMs / 1000));
        response.addCookie(cookie);
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/api/v1/auth");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private void writeAuditLog(User user, String action, String entityName,
                                String entityId, HttpServletRequest request) {
        AuditLog log = AuditLog.builder()
                .organizationId(user.getOrganizationId())
                .userId(user.getUserId())
                .action(action)
                .entityName(entityName)
                .entityId(UUID.fromString(entityId))
                .ipAddress(request != null ? request.getRemoteAddr() : null)
                .build();
        auditLogRepository.save(log);
    }
}
