package com.example.cng_booking.services;

import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.cng_booking.exceptions.BadRequestException;
import com.example.cng_booking.models.SubscriptionModel;
import com.example.cng_booking.models.SuperAdmin;
import com.example.cng_booking.repositories.SubscriptionModelRepo;
import com.example.cng_booking.repositories.SuperAdminRepo;
import com.example.cng_booking.request_dtos.CreateSubscriptionModelDTO;

import jakarta.validation.Valid;

@Service
public class SubscriptionModelService {

    @Autowired
    private SubscriptionModelRepo subscriptionModelRepo;

    @Autowired
    private SuperAdminRepo superAdminRepo;

    public void createSubscriptionModel(@Valid CreateSubscriptionModelDTO req) {

        if (req == null) {
            throw new BadRequestException("Bad request");
        } else if (!superAdminRepo.existsByAdminId(req.adminId())) {
            throw new BadRequestException("Invalid adminId: " + req.adminId());
        }

        SuperAdmin admin = superAdminRepo.findByAdminId(req.adminId());

        SubscriptionModel subs = new SubscriptionModel(
                req.subsName(),
                req.duration(),
                req.amount(),
                req.bookingAmount(),
                admin,
                new ArrayList<>()
        );

        subscriptionModelRepo.save(subs);
    }

    public SubscriptionModel getSubscriptionModelObj(Long subsId) {

        if (subsId == null || subsId <= 0) {
            throw new BadRequestException("Subscription ID is null or invalid");
        }

        return subscriptionModelRepo.findById(subsId)
                .orElseThrow(() -> new BadRequestException("SubscriptionModel not found"));
    }
}