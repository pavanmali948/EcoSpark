package com.example.cng_booking.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.cng_booking.models.Pumps;

public interface PumpsRepo extends JpaRepository<Pumps, String> {
    Pumps findByLicenseNo(String licenseNo);
    boolean existsByLicenseNo(String licenseNo);
}
