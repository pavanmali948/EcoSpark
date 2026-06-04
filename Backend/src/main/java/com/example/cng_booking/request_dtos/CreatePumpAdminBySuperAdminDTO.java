package com.example.cng_booking.request_dtos;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record CreatePumpAdminBySuperAdminDTO(
        @NotBlank(message = "licenseNo is required")
        String licenseNo,
        @NotBlank(message = "pumpName is required")
        String pumpName,
        @NotBlank(message = "streetName is required")
        String streetName,
        @NotBlank(message = "landmark is required")
        String landmark,
        @NotNull(message = "pincode is required")
        @Min(value = 100000, message = "invalid pincode")
        @Max(value = 999999, message = "invalid pincode")
        Integer pincode,
        @NotNull(message = "latitude is required")
        Double latitude,
        @NotNull(message = "longitude is required")
        Double longitude,
        @NotBlank(message = "password is required")
        @Pattern(
                regexp = "^(?=.*[0-9])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,20}$",
                message = "Password must contain uppercase, digit, special char, and 6+ chars"
        )
        String password
) {}
