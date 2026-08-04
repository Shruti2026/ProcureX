package com.procurex.identityservice.service.impl;

import com.procurex.identityservice.dto.request.CreateEmployeeRequest;
import com.procurex.identityservice.dto.response.UserRegisterResponse;
import com.procurex.identityservice.entity.AccountStatus;
import com.procurex.identityservice.entity.AuditLog;
import com.procurex.identityservice.entity.Role;
import com.procurex.identityservice.entity.RoleName;
import com.procurex.identityservice.entity.User;
import com.procurex.identityservice.exception.ConflictException;
import com.procurex.identityservice.repository.AuditLogRepository;
import com.procurex.identityservice.repository.RefreshTokenRepository;
import com.procurex.identityservice.repository.RoleRepository;
import com.procurex.identityservice.repository.UserRepository;
import com.procurex.identityservice.service.AdminUserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Service responsible for administrative user management,
 * including employee creation and vendor approval workflows.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserServiceImpl implements AdminUserService {

    /**
     * Roles that can be assigned to internal employees.
     * ADMIN and VENDOR are explicitly excluded.
     */
    private static final Set<RoleName> ALLOWED_EMPLOYEE_ROLES = EnumSet.of(
            RoleName.PROCUREMENT_MANAGER,
            RoleName.INVENTORY_MANAGER,
            RoleName.FINANCE_MANAGER
    );

    private static final String TEMP_PASSWORD_CHARS = // NOSONAR
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    private static final int TEMP_PASSWORD_LENGTH = 16;

    private static final String ADMIN_NOT_FOUND =
        "Authenticated admin account was not found";

    private static final String USERS_ENTITY = "users";

    private final UserRepository      userRepository;
    private final RoleRepository      roleRepository;
    private final AuditLogRepository  auditLogRepository;
    private final PasswordEncoder     passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // -------------------------------------------------------------------------
    // Create Employee
    // -------------------------------------------------------------------------
    @Override
    @Transactional
    public UserRegisterResponse createEmployee(CreateEmployeeRequest request, String adminEmail) {
        if (!ALLOWED_EMPLOYEE_ROLES.contains(request.role())) {
            throw new IllegalArgumentException(
                    "Invalid role for employee creation. Allowed roles: "
                    + ALLOWED_EMPLOYEE_ROLES);
        }

        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("A user with this email already exists");
        }

        Role role = roleRepository.findByRoleName(request.role())
                .orElseThrow(() -> new IllegalArgumentException("Requested role does not exist: " + request.role()));

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new IllegalStateException(ADMIN_NOT_FOUND));

        String tempPassword    = generateTemporaryPassword();
        String encodedPassword = passwordEncoder.encode(tempPassword);

        User employee = User.builder()
                .organizationId(request.organizationId())
                .fullName(request.fullName())
                .email(request.email())
                .password(encodedPassword)
                .phoneNumber(request.phoneNumber())
                .role(role)
                .accountStatus(AccountStatus.ACTIVE)
                .failedLoginAttempts(0)
                .createdBy(admin.getUserId())
                .updatedBy(admin.getUserId())
                .build();

        User saved = userRepository.save(employee);

        writeAuditLog(admin, "CREATE_EMPLOYEE", USERS_ENTITY, saved.getUserId().toString());
        log.info("Employee created: userId={}, role={}, by admin={}",
                saved.getUserId(), request.role(), adminEmail);

        return new UserRegisterResponse(
                saved.getUserId(),
                saved.getOrganizationId(),
                saved.getFullName(),
                saved.getEmail(),
                saved.getRole().getRoleName().name(),
                saved.getAccountStatus(),
                tempPassword   // returned once — admin must communicate this securely
        );
    }

    // -------------------------------------------------------------------------
    // Get Pending Vendors
    // -------------------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<UserRegisterResponse> getPendingVendors() {
        return userRepository
                .findByRoleRoleNameAndAccountStatus(RoleName.VENDOR, AccountStatus.PENDING)
                .stream()
                .map(u -> new UserRegisterResponse(
                        u.getUserId(),
                        u.getOrganizationId(),
                        u.getFullName(),
                        u.getEmail(),
                        u.getRole().getRoleName().name(),
                        u.getAccountStatus(),
                        null  // no temporary password for vendors
                ))
                .toList();
    }

    // -------------------------------------------------------------------------
    // Approve Vendor
    // -------------------------------------------------------------------------
    @Override
    @Transactional
    public UserRegisterResponse approveVendor(UUID vendorUserId, String adminEmail) {
        User vendor = findPendingVendor(vendorUserId);

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new IllegalStateException(ADMIN_NOT_FOUND));

        vendor.setAccountStatus(AccountStatus.ACTIVE);
        vendor.setUpdatedBy(admin.getUserId());
        User saved = userRepository.save(vendor);

        writeAuditLog(admin, "APPROVE_VENDOR", USERS_ENTITY, vendorUserId.toString());
        log.info("Vendor approved: userId={}, by admin={}", vendorUserId, adminEmail);

        return toResponse(saved);
    }

    // -------------------------------------------------------------------------
    // Reject Vendor
    // -------------------------------------------------------------------------
    @Override
    @Transactional
    public UserRegisterResponse rejectVendor(UUID vendorUserId, String adminEmail) {
        User vendor = findPendingVendor(vendorUserId);

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new IllegalStateException(ADMIN_NOT_FOUND));

        vendor.setAccountStatus(AccountStatus.REJECTED);
        vendor.setUpdatedBy(admin.getUserId());
        User saved = userRepository.save(vendor);

        writeAuditLog(admin, "REJECT_VENDOR", USERS_ENTITY, vendorUserId.toString());
        log.info("Vendor rejected: userId={}, by admin={}", vendorUserId, adminEmail);

        return toResponse(saved);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private User findPendingVendor(UUID vendorUserId) {
        User user = userRepository.findById(vendorUserId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Vendor not found with id: " + vendorUserId));

        if (user.getRole().getRoleName() != RoleName.VENDOR) {
            throw new IllegalArgumentException("User is not a vendor");
        }
        if (user.getAccountStatus() != AccountStatus.PENDING) {
            throw new IllegalStateException(
                    "Vendor is not in PENDING status. Current status: " + user.getAccountStatus());
        }
        return user;
    }

    private UserRegisterResponse toResponse(User user) {
        return new UserRegisterResponse(
                user.getUserId(),
                user.getOrganizationId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().getRoleName().name(),
                user.getAccountStatus(),
                null
        );
    }

    private String generateTemporaryPassword() {
        StringBuilder sb = new StringBuilder(TEMP_PASSWORD_LENGTH);

        for (int i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
            sb.append(TEMP_PASSWORD_CHARS.charAt(SECURE_RANDOM.nextInt(TEMP_PASSWORD_CHARS.length())));
        }

        return sb.toString();
    }

    private void writeAuditLog(User actor, String action, String entityName, String entityId) {
        AuditLog log = AuditLog.builder()
                .organizationId(actor.getOrganizationId())
                .userId(actor.getUserId())
                .action(action)
                .entityName(entityName)
                .entityId(UUID.fromString(entityId))
                .ipAddress(null)
                .build();
        auditLogRepository.save(log);
    }

    // -------------------------------------------------------------------------
    // Update User Status
    // -------------------------------------------------------------------------
    @Override
    @Transactional
    public UserRegisterResponse updateUserStatus(UUID userId, AccountStatus status, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new IllegalStateException(ADMIN_NOT_FOUND));

        if (admin.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Admin cannot change their own status");
        }

        user.setAccountStatus(status);
        if (status == AccountStatus.ACTIVE) {
            user.setFailedLoginAttempts(0);
        }
        user.setUpdatedBy(admin.getUserId());
        User saved = userRepository.save(user);

        writeAuditLog(admin, "UPDATE_USER_STATUS", USERS_ENTITY, userId.toString());
        log.info("User status updated: userId={}, status={}, by admin={}", userId, status, adminEmail);

        return toResponse(saved);
    }

    // -------------------------------------------------------------------------
    // Get All Employees
    // -------------------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<UserRegisterResponse> getAllEmployees() {
        List<RoleName> employeeRoles = List.of(
                RoleName.PROCUREMENT_MANAGER,
                RoleName.INVENTORY_MANAGER,
                RoleName.FINANCE_MANAGER
        );
        return userRepository.findByRoleRoleNameIn(employeeRoles).stream()
                .map(this::toResponse)
                .toList();
    }

    // -------------------------------------------------------------------------
    // Get All Vendors
    // -------------------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<UserRegisterResponse> getAllVendors() {
        return userRepository.findByRoleRoleNameIn(List.of(RoleName.VENDOR)).stream()
                .map(this::toResponse)
                .toList();
    }

    // -------------------------------------------------------------------------
    // Delete User
    // -------------------------------------------------------------------------
    @Override
    @Transactional
    public void deleteUser(UUID userId, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new IllegalStateException(ADMIN_NOT_FOUND));

        if (admin.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Admin cannot delete their own account");
        }

        // Soft delete: mark account as INACTIVE instead of removing the row
        user.setAccountStatus(AccountStatus.INACTIVE);
        userRepository.save(user);

        // Revoke all active refresh tokens so the user is immediately logged out
        refreshTokenRepository.revokeAllActiveByUser(user);

        writeAuditLog(admin, "SOFT_DELETE_USER", USERS_ENTITY, userId.toString());
        log.info("User soft-deleted (set INACTIVE): userId={}, by admin={}", userId, adminEmail);
    }
}

