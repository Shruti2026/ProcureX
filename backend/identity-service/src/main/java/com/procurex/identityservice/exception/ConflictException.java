package com.procurex.identityservice.exception;

/**
 * Thrown when an operation cannot be completed because it would
 * conflict with the current state of the system.
 */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
