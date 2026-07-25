package com.procurex.identityservice.entity;

/**
 * Represents the lifecycle state of a user account.
 */
public enum AccountStatus {
    ACTIVE,
    INACTIVE,
    PENDING,
    REJECTED,
    SUSPENDED,
    LOCKED
}
