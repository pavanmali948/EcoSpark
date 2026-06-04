package com.example.cng_booking.projections;

public record WorkerCountByPumpDTO(
        String licenseNo,
        String pumpName,
        long workerCount
) {}
