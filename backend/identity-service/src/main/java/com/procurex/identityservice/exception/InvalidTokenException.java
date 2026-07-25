package com.procurex.identityservice.exception;

/**
 * Thrown when an authentication token is invalid, expired, or malformed.
 */
public class InvalidTokenException extends RuntimeException {

    public InvalidTokenException(String message) {
        super(message);
    }
}
