package com.example.cng_booking.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.cng_booking.exceptions.BadRequestException;
import com.example.cng_booking.models.Address;
import com.example.cng_booking.repositories.AddressRepo;


@Service
public class AddressService {

    @Autowired
    private AddressRepo addressRepo;

    public Address createAddress(Address req) {

        if (req == null) {
            throw new BadRequestException("Bad Request");
        }

        Address address = addressRepo.save(req);
        return address;
    }

    public Address getAddressObj(String addressId) {

        if (addressId == null || addressId.isBlank()) {
            throw new BadRequestException("Address ID is null or empty");
        } else if (!addressRepo.existsByAddressId(addressId)) {
            throw new BadRequestException("Address ID does not exist");
        }

        Address address = addressRepo.findByAddressId(addressId);
        return address;
    }
}