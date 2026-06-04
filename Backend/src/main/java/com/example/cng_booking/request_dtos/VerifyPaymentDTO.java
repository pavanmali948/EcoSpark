package com.example.cng_booking.request_dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record VerifyPaymentDTO(
        @NotBlank String orderId,
        @NotBlank String paymentId,
        @NotBlank String signature,
        @NotBlank String customerId,
        @Positive Long slotId,
        @NotBlank String licenseNo,
        @NotBlank String vehicleNumber) {
}
