package com.example.cng_booking.request_dtos;

import jakarta.validation.constraints.NotBlank;

public record ChangeUserPasswordDTO(
        @NotBlank(message = "identifier (email) is required")
        String identifier,

        @NotBlank(message = "currentPassword is required")
        String currentPassword,

        @NotBlank(message = "newPassword is required")
        String newPassword
) {
}

