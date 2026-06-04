package com.example.cng_booking.request_dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record CreateSubscriptionOrderDTO(
        @Positive Long planId,
        @NotBlank String pumpAdminId) {
}
