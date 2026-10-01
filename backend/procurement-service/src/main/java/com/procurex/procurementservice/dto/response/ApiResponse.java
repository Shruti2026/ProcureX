package com.procurex.procurementservice.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Generic wrapper for all REST API responses.
 *
 * @param success indicates whether the request completed successfully
 * @param message human-readable response message
 * @param data    response payload, if applicable
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        String message,
        T data
) {
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    public static <T> ApiResponse<T> success(String message) {
        return new ApiResponse<>(true, message, null);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }
}
