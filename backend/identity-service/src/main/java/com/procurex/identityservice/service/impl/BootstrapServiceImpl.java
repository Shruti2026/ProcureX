package com.procurex.identityservice.service.impl;

import com.procurex.identityservice.dto.request.BootstrapAdminRequest;
import com.procurex.identityservice.dto.response.UserRegisterResponse;
import com.procurex.identityservice.entity.AccountStatus;
import com.procurex.identityservice.entity.Role;
import com.procurex.identityservice.entity.RoleName;
import com.procurex.identityservice.entity.User;
import com.procurex.identityservice.exception.ConflictException;
import com.procurex.identityservice.repository.RoleRepository;
import com.procurex.identityservice.repository.UserRepository;
import com.procurex.identityservice.service.BootstrapService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service responsible for creating the initial administrator account
 * during system bootstrap.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BootstrapServiceImpl implements BootstrapService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UserRegisterResponse createInitialAdmin(BootstrapAdminRequest request) {
        if (userRepository.existsByRoleRoleName(RoleName.ADMIN)) {
            throw new ConflictException("Initial administrator account has already been bootstrapped");
        }

        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("A user with this email already exists");
        }

        Role adminRole = roleRepository.findByRoleName(RoleName.ADMIN)
                .orElseThrow(() -> new IllegalStateException("ADMIN role does not exist"));

        User user = User.builder()
                .organizationId(request.organizationId())
                .fullName(request.fullName())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .phoneNumber(request.phoneNumber())
                .role(adminRole)
                .accountStatus(AccountStatus.ACTIVE)
                .failedLoginAttempts(0)
                .build();

        User saved = userRepository.save(user);

        log.info("Initial administrator created: userId={}, email={}",
            saved.getUserId(),
            saved.getEmail());

        return new UserRegisterResponse(
                saved.getUserId(),
                saved.getOrganizationId(),
                saved.getFullName(),
                saved.getEmail(),
                saved.getRole().getRoleName().name(),
                saved.getAccountStatus(),
                null
        );
    }
}
