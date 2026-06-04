package com.example.cng_booking.request_dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record CreatePaymentOrderDTO(
        @NotNull @Positive Double amount,
        @NotBlank String customerId,
        @NotNull @Positive Long slotId,
        @NotBlank String licenseNo,
        @NotBlank String vehicleNumber) {
}
