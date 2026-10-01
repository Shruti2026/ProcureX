package com.procurex.vendorcatalogservice.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateVendorRequest(

        @Size(max = 200, message = "Company name must not exceed 200 characters")
        String companyName,

        @Size(max = 100, message = "Contact person name must not exceed 100 characters")
        String contactPerson,

        @Size(max = 100, message = "Email must not exceed 100 characters")
        String email,

        @Size(max = 20, message = "Phone number must not exceed 20 characters")
        String phoneNumber,

        @Size(max = 255, message = "Address must not exceed 255 characters")
        String address,

        @Size(max = 100, message = "City must not exceed 100 characters")
        String city,

        @Size(max = 100, message = "State must not exceed 100 characters")
        String state,

        @Size(max = 100, message = "Country must not exceed 100 characters")
        String country,

        @Size(max = 20, message = "Postal code must not exceed 20 characters")
        String postalCode,

        @Size(max = 30, message = "GST number must not exceed 30 characters")
        String gstNumber
) {}
