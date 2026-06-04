package com.example.cng_booking.projections;

import java.time.Instant;

public record PumpWorkerDTO(
        String workerId,
        String workerName,
        String email,
        Instant createdAt) {
}

