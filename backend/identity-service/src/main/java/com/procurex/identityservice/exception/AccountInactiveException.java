package com.procurex.identityservice.exception;

/**
 * Thrown when an operation is attempted on an inactive user account.
 */
public class AccountInactiveException extends RuntimeException {

    public AccountInactiveException(String message) {
        super(message);
    }
}
