package com.procurex.identityservice.dto.response;

/**
 * Response payload returned after successfully refreshing an access token.
 *
 * @param accessToken newly issued JWT access token
 * @param expiresIn access token lifetime in seconds
 */
public record TokenRefreshResponse(
        String accessToken,
        int expiresIn
) {}
