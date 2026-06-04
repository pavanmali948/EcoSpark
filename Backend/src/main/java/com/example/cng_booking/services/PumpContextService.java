package com.example.cng_booking.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.cng_booking.authentication.CustomPrincipal;
import com.example.cng_booking.exceptions.BadRequestException;
import com.example.cng_booking.repositories.PumpWorkersRepo;

@Service
public class PumpContextService {

    @Autowired
    private PumpWorkersRepo pumpWorkersRepo;

    public String resolvePumpLicenseForStaff() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomPrincipal principal)) {
            throw new BadRequestException("Not authenticated");
        }

        String role = principal.getRole();
        if (role == null || role.isBlank()) {
            throw new BadRequestException("Missing role in token");
        }

        return switch (role.toUpperCase()) {
            case "PUMP_ADMIN" -> principal.getUsername();
            case "PUMP_WORKER" -> {
                var worker = pumpWorkersRepo.findByWorkerId(principal.getUsername());
                if (worker == null || worker.getPump() == null) {
                    throw new BadRequestException("Pump worker mapping not found for workerId=" + principal.getUsername());
                }
                yield worker.getPump().getLicenseNo();
            }
            default -> throw new BadRequestException("Only pump staff can access this resource (role=" + role + ")");
        };
    }

    public boolean isPumpStaff(Authentication auth) {
        if (auth == null || !(auth.getPrincipal() instanceof CustomPrincipal principal)) return false;
        String role = principal.getRole();
        if (role == null) return false;
        return "PUMP_ADMIN".equalsIgnoreCase(role) || "PUMP_WORKER".equalsIgnoreCase(role);
    }
}
