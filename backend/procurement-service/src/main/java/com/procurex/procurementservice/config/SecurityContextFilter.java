package com.procurex.procurementservice.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Filter that reads pre-validated identity headers injected by the API Gateway
 * and populates the SecurityContext. No JWT parsing happens here.
 */
@Component
@Slf4j
public class SecurityContextFilter extends OncePerRequestFilter {

    public static final String ORGANIZATION_ID_ATTR = "X-Organization-Id";

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String userId = request.getHeader("X-User-Id");
        String rolesHeader = request.getHeader("X-User-Roles");
        String organizationId = request.getHeader("X-Organization-Id");

        if (StringUtils.hasText(userId)) {
            List<SimpleGrantedAuthority> authorities = parseAuthorities(rolesHeader);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, authorities);

            authentication.setDetails(Map.of("organizationId", organizationId != null ? organizationId : ""));
            request.setAttribute(ORGANIZATION_ID_ATTR, organizationId != null ? organizationId : "");

            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.debug("SecurityContext populated for user: {}, org: {}", userId, organizationId);
        }

        filterChain.doFilter(request, response);
    }

    private List<SimpleGrantedAuthority> parseAuthorities(String rolesHeader) {
        if (!StringUtils.hasText(rolesHeader)) {
            return Collections.emptyList();
        }
        return Arrays.stream(rolesHeader.split(","))
                .map(String::trim)
                .filter(role -> !role.isEmpty())
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .collect(Collectors.toList());
    }
}
