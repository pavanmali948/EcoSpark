package com.example.cng_booking.config;

import java.util.ArrayList;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.cng_booking.models.SubscriptionModel;
import com.example.cng_booking.models.SuperAdmin;
import com.example.cng_booking.repositories.SubscriptionModelRepo;
import com.example.cng_booking.repositories.SuperAdminRepo;

@Component
public class SuperAdminBootstrap implements CommandLineRunner {

    private final SuperAdminRepo superAdminRepo;
    private final SubscriptionModelRepo subscriptionModelRepo;
    private final PasswordEncoder passwordEncoder;

    public SuperAdminBootstrap(SuperAdminRepo superAdminRepo,
                               SubscriptionModelRepo subscriptionModelRepo,
                               PasswordEncoder passwordEncoder) {
        this.superAdminRepo = superAdminRepo;
        this.subscriptionModelRepo = subscriptionModelRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        final String hardcodedUsername = "superadmin@ecospark.com";
        final String hardcodedPassword = "SuperAdmin1";
        final String hardcodedName = "Super Admin";

        SuperAdmin admin = superAdminRepo.findByEmail(hardcodedUsername);
        if (admin == null) {
            admin = new SuperAdmin(hardcodedName, hardcodedUsername, passwordEncoder.encode(hardcodedPassword), new ArrayList<>());
        } else {
            // Enforce deterministic credentials on every startup so login never drifts.
            admin.setName(hardcodedName);
            admin.setEmail(hardcodedUsername);
            admin.setPassword(passwordEncoder.encode(hardcodedPassword));
        }
        admin = superAdminRepo.save(admin);

        if (subscriptionModelRepo.findAll().isEmpty()) {
            subscriptionModelRepo.save(new SubscriptionModel("Quarterly", "quarterly", 3999f, 0f, admin, new ArrayList<>()));
            subscriptionModelRepo.save(new SubscriptionModel("Semi-Yearly", "semi-yearly", 7999f, 0f, admin, new ArrayList<>()));
            subscriptionModelRepo.save(new SubscriptionModel("Yearly", "yearly", 9999f, 0f, admin, new ArrayList<>()));
        }
    }
}
