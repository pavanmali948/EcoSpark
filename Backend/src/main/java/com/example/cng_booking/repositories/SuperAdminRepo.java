package com.example.cng_booking.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.cng_booking.models.SuperAdmin;

public interface SuperAdminRepo extends JpaRepository<SuperAdmin, String> {
    SuperAdmin findByEmail(String email);
    SuperAdmin findByAdminId(String adminId);
    boolean existsByEmail(String email);
    boolean existsByAdminId(String adminId);
}
