package com.example.cng_booking.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import com.example.cng_booking.authentication.CustomPrincipal;
import com.example.cng_booking.exceptions.BadRequestException;
import com.example.cng_booking.exceptions.NotFoundException;
import com.example.cng_booking.models.PumpWorkers;
import com.example.cng_booking.models.Pumps;
import com.example.cng_booking.models.SuperAdmin;
import com.example.cng_booking.models.Users;
import com.example.cng_booking.repositories.PumpWorkersRepo;
import com.example.cng_booking.repositories.PumpsRepo;
import com.example.cng_booking.repositories.SuperAdminRepo;
import com.example.cng_booking.repositories.UsersRepo;

@Component
public class CustomDetailsService {
    
    @Autowired 
    private UsersRepo usersRepo;

    @Autowired 
    private PumpsRepo pumpsRepo;

    @Autowired 
    private PumpWorkersRepo pumpWorkersRepo;

    @Autowired
    private SuperAdminRepo superAdminRepo;

    public UserDetails loadUser(String id, String role) {

        switch (role.toUpperCase()) {

            case "USER" -> {
                Users u = usersRepo.findByEmail(id);

                if (u == null) {
                    throw new NotFoundException("User not found");
                }

                return new CustomPrincipal(id, u.getPassword(), role);
            }
                
            case "SUPER_ADMIN" -> {
                SuperAdmin s = superAdminRepo.findByAdminId(id);
                if (s == null && id != null && !id.isBlank()) {
                    s = superAdminRepo.findByEmail(id.trim());
                }

                if (s == null) {
                    throw new NotFoundException("Super Admin not found");
                }

                // JWT subject should stay stable; use adminId internally.
                return new CustomPrincipal(s.getAdminId(), s.getPassword(), role);
            }

            case "PUMP_ADMIN" -> {
                Pumps p = pumpsRepo.findByLicenseNo(id);

                if (p == null) {
                    throw new NotFoundException("Pump Admin not found");
                }

                return new CustomPrincipal(id, p.getPassword(), role);
            }

            case "PUMP_WORKER" -> {
                PumpWorkers p = pumpWorkersRepo.findByWorkerId(id);
                if (p == null && id != null && !id.isBlank()) {
                    p = pumpWorkersRepo.findByEmail(id.trim());
                }
                if (p == null) {
                    throw new NotFoundException("Pump Worker not found");
                }
                // JWT subject must be workerId so later requests resolve the same user
                return new CustomPrincipal(p.getWorkerId(), p.getPassword(), role);
            }
        
            default -> throw new BadRequestException("Invalid role");
        }
    }
}

