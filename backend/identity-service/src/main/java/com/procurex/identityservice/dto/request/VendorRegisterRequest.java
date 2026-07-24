package com.procurex.identityservice.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for public vendor self-registration.
 * The backend always assigns role = VENDOR and status = PENDING.
 * The client never sends a role field.
 */
public record VendorRegisterRequest(

        @NotBlank(message = "Company name is required")
        @Size(max = 200, message = "Company name must not exceed 200 characters")
        String companyName,

        @NotBlank(message = "Contact person name is required")
        @Size(max = 100, message = "Contact person name must not exceed 100 characters")
        String contactPerson,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be a valid email address")
        @Size(max = 100, message = "Email must not exceed 100 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 255, message = "Password must be between 8 and 255 characters")
        String password,

        @Size(max = 15, message = "Phone number must not exceed 15 characters")
        String phone
) {}
