package com.procurex.identityservice.exception;

/**
 * Thrown when a vendor attempts to log in while their account is still
 * in PENDING status, awaiting administrator approval.
 */
public class AccountPendingException extends RuntimeException {

    public AccountPendingException(String message) {
        super(message);
    }
}
