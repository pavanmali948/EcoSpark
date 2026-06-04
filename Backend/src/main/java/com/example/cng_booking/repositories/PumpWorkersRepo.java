package com.example.cng_booking.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.cng_booking.models.PumpWorkers;

public interface PumpWorkersRepo extends JpaRepository<PumpWorkers, String> {
    PumpWorkers findByWorkerId(String workerId);

    PumpWorkers findByEmail(String email);

    boolean existsByWorkerId(String workerId);
    boolean existsByEmail(String email);
    void deleteByWorkerId(String workerId);
    List<PumpWorkers> findByPump_LicenseNo(String licenseNo);
}
