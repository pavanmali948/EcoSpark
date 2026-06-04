package com.example.cng_booking.request_dtos;

import jakarta.validation.constraints.NotBlank;

public record RequestQrCodeDTO(
        @NotBlank(message = "qrCode is required")
        String qrCode) {
}

