package com.example.cng_booking.request_dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record VerifySubscriptionPaymentDTO(
        @Positive Long planId,
        @NotBlank String pumpAdminId,
        @NotBlank String orderId,
        @NotBlank String paymentId,
        @NotBlank String signature) {
}
