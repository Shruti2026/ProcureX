package com.procurex.procurementservice.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Feign configuration that relays the identity headers injected by the API Gateway
 * (X-User-Id, X-Organization-Id, X-User-Roles) onto every outgoing Feign request.
 *
 * <p>The API Gateway validates the JWT and injects these headers into the request
 * forwarded to this service. Without this interceptor, any Feign call made by this
 * service starts with a blank request — downstream services see no identity headers,
 * their SecurityContextFilter leaves the request unauthenticated, and Spring Security
 * rejects it with 403, which then surfaces as a 502 to the original caller.
 */
@Configuration
public class FeignHeaderRelayConfig {

    private static final String HEADER_USER_ID       = "X-User-Id";
    private static final String HEADER_ORGANIZATION  = "X-Organization-Id";
    private static final String HEADER_USER_ROLES    = "X-User-Roles";

    @Bean
    public RequestInterceptor relayIdentityHeaders() {
        return (RequestTemplate template) -> {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) {
                return;
            }

            HttpServletRequest request = attrs.getRequest();
            copyHeader(template, request, HEADER_USER_ID);
            copyHeader(template, request, HEADER_ORGANIZATION);
            copyHeader(template, request, HEADER_USER_ROLES);
        };
    }

    private void copyHeader(RequestTemplate template,
                            HttpServletRequest request,
                            String headerName) {
        String value = request.getHeader(headerName);
        if (StringUtils.hasText(value)) {
            template.header(headerName, value);
        }
    }
}
