package com.procurex.identityservice.exception;

/**
 * Exception thrown when a suspended user attempts to log in.
 */
public class AccountSuspendedException extends RuntimeException {
    public AccountSuspendedException(String message) {
        super(message);
    }
}
