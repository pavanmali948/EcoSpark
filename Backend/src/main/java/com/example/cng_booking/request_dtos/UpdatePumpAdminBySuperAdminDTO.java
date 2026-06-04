package com.example.cng_booking.request_dtos;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdatePumpAdminBySuperAdminDTO(
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
        Double longitude
) {}
