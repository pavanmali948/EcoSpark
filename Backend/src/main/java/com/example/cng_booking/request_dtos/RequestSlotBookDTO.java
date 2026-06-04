package com.example.cng_booking.request_dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record RequestSlotBookDTO(

    @Positive(message = "slotIntervalId must be positive")
    long slotIntervalId,

    @NotBlank(message = "userId is required")
    String userId,

    @NotBlank(message = "licenseNo is required")
    String licenseNo,

    @NotBlank(message = "transactionId is required")
    String transactionId,

    @NotBlank(message = "vehicleNumber is required")
    String vehicleNumber
) {
}
