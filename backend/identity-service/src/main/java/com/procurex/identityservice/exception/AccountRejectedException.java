package com.procurex.identityservice.exception;

/**
 * Thrown when a user attempts to log in but their account has been
 * rejected by an administrator.
 */
public class AccountRejectedException extends RuntimeException {

    public AccountRejectedException(String message) {
        super(message);
    }
}
