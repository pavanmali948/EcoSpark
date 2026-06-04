package com.example.cng_booking.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.cng_booking.models.Users;

public interface UsersRepo extends JpaRepository<Users, String> {
    Users findByEmail(String email);
    boolean existsByEmail(String email);
    Users findByUserId(String userId);
    boolean existsByUserId(String userId);
}
