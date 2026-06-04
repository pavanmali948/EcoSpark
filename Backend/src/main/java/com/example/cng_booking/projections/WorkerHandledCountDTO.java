package com.example.cng_booking.projections;

public record WorkerHandledCountDTO(
        String workerId,
        String workerName,
        long handledCount) {
}
