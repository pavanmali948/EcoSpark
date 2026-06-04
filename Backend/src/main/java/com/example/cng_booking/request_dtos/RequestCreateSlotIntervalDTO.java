package com.example.cng_booking.request_dtos;

import java.sql.Time;

import jakarta.validation.constraints.NotNull;

public record RequestCreateSlotIntervalDTO(

    @NotNull(message = "start time is required")
    Time start,

    @NotNull(message = "end time is required")
    Time end
) {
}