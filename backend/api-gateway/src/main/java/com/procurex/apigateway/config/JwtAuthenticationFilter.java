package com.procurex.apigateway.config;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Global JWT authentication filter for the API Gateway.
 * Runs before all other filters (order = -1).
 * Skips public paths; for all other requests it validates the Bearer token
 * and injects X-User-Id, X-Organization-Id, and X-User-Roles headers.
 */
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/vendor/register",
            "/api/v1/bootstrap"
    );

    private final JwtUtil jwtUtil;

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public int getOrder() {
        return -1;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        // Skip authentication for public paths
        if (PUBLIC_PATHS.stream().anyMatch(p -> path.startsWith(p))) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);

        if (!jwtUtil.isTokenValid(token)) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String userId = jwtUtil.extractUserId(token);
        String orgId = jwtUtil.extractOrganizationId(token);
        String role = jwtUtil.extractRole(token);

        ServerHttpRequest mutated = exchange.getRequest().mutate()
                .header("X-User-Id", userId)
                .header("X-Organization-Id", orgId)
                .header("X-User-Roles", role)
                .build();

        return chain.filter(exchange.mutate().request(mutated).build());
    }
}
