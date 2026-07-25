package com.procurex.identityservice.dto.response;

import java.util.UUID;

/**
 * Response payload returned after successful authentication.
 *
 * @param accessToken JWT access token used for authenticated requests
 * @param expiresIn access token lifetime in seconds
 * @param userId authenticated user's identifier
 * @param role authenticated user's role
 * @param organizationId identifier of the user's organization
 */
public record LoginResponse(
        String accessToken,
        int expiresIn,
        UUID userId,
        String role,
        UUID organizationId
) {}
