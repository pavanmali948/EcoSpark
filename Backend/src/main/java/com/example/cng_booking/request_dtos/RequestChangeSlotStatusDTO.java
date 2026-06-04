package com.example.cng_booking.request_dtos;

import jakarta.validation.constraints.NotBlank;

public record RequestChangeSlotStatusDTO(

    @NotBlank(message = "qrCode is mandatory")
    String qrCode,

    @NotBlank(message = "licenseNo is required")
    String licenseNo 
) {
} 