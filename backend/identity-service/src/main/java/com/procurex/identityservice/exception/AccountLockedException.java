package com.procurex.identityservice.exception;

/**
 * Thrown when an operation is attempted on a locked user account.
 */
public class AccountLockedException extends RuntimeException {

    public AccountLockedException(String message) {
        super(message);
    }
}
