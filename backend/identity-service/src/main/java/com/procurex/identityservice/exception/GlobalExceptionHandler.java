package com.procurex.identityservice.exception;

import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // -------------------------------------------------------------------------
    // 400 – Validation errors
    // -------------------------------------------------------------------------
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        Map<String, String> validationErrors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            validationErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                HttpStatus.BAD_REQUEST.value(),
                "Bad Request",
                "Validation failed",
                request.getRequestURI(),
                validationErrors
        );
        return ResponseEntity.badRequest().body(body);
    }

    // -------------------------------------------------------------------------
    // 400 – Illegal argument / state
    // -------------------------------------------------------------------------
    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<ErrorResponse> handleBadRequest(
            RuntimeException ex, HttpServletRequest request) {

        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    // -------------------------------------------------------------------------
    // 409 â€“ Conflict
    // -------------------------------------------------------------------------
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> handleConflict(
            ConflictException ex, HttpServletRequest request) {

        return buildResponse(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    // -------------------------------------------------------------------------
    // 401 – Bad credentials
    // -------------------------------------------------------------------------
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(
            BadCredentialsException ex, HttpServletRequest request) {

        return buildResponse(HttpStatus.UNAUTHORIZED, ex.getMessage(), request);
    }

    // -------------------------------------------------------------------------
    // 401 – Invalid token
    // -------------------------------------------------------------------------
    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<ErrorResponse> handleInvalidToken(
            InvalidTokenException ex, HttpServletRequest request) {

        return buildResponse(HttpStatus.UNAUTHORIZED, ex.getMessage(), request);
    }

    // -------------------------------------------------------------------------
    // 403 – Forbidden
    // -------------------------------------------------------------------------
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {

        return buildResponse(HttpStatus.FORBIDDEN, "Access denied", request);
    }

    // -------------------------------------------------------------------------
    // 404 – Not found
    // -------------------------------------------------------------------------
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            EntityNotFoundException ex, HttpServletRequest request) {

        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    // -------------------------------------------------------------------------
    // 422 – Account inactive
    // -------------------------------------------------------------------------
    @ExceptionHandler(AccountInactiveException.class)
    public ResponseEntity<ErrorResponse> handleInactive(
            AccountInactiveException ex, HttpServletRequest request) {

        return buildResponse(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), request);
    }

    // -------------------------------------------------------------------------
    // 403 – Account pending approval
    // -------------------------------------------------------------------------
    @ExceptionHandler(AccountPendingException.class)
    public ResponseEntity<ErrorResponse> handlePending(
            AccountPendingException ex, HttpServletRequest request) {

        return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage(), request);
    }

    // -------------------------------------------------------------------------
    // 403 – Account rejected
    // -------------------------------------------------------------------------
    @ExceptionHandler(AccountRejectedException.class)
    public ResponseEntity<ErrorResponse> handleRejected(
            AccountRejectedException ex, HttpServletRequest request) {

        return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage(), request);
    }

    // -------------------------------------------------------------------------
    // 423 – Account locked
    // -------------------------------------------------------------------------
    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ErrorResponse> handleLocked(
            AccountLockedException ex, HttpServletRequest request) {

        return buildResponse(HttpStatus.LOCKED, ex.getMessage(), request);
    }

    // -------------------------------------------------------------------------
    // 500 – Catch-all
    // -------------------------------------------------------------------------
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(
            Exception ex, HttpServletRequest request) {

        log.error("Unhandled exception at {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", request);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    private ResponseEntity<ErrorResponse> buildResponse(
            HttpStatus status, String message, HttpServletRequest request) {

        ErrorResponse body = new ErrorResponse(
                Instant.now().toString(),
                status.value(),
                status.getReasonPhrase(),
                message,
                request.getRequestURI(),
                null
        );
        return ResponseEntity.status(status).body(body);
    }

    // -------------------------------------------------------------------------
    // Error response record
    // -------------------------------------------------------------------------
    public record ErrorResponse(
            String timestamp,
            int status,
            String error,
            String message,
            String path,
            Map<String, String> validationErrors
    ) {}
}
