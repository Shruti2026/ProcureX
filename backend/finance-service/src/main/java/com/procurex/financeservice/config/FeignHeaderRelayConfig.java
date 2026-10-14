package com.procurex.financeservice.config;

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
 */
@Configuration
public class FeignHeaderRelayConfig {

    private static final String HEADER_USER_ID      = "X-User-Id";
    private static final String HEADER_ORGANIZATION = "X-Organization-Id";
    private static final String HEADER_USER_ROLES   = "X-User-Roles";

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
