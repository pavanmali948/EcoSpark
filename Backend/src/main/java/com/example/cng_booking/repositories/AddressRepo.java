package com.example.cng_booking.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.cng_booking.models.Address;

public interface AddressRepo extends JpaRepository<Address, String> {
    Address findByAddressId(String addressId);
    boolean existsByAddressId(String addressId);
}
