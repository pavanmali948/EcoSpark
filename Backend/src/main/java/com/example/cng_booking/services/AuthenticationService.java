package com.example.cng_booking.services;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.example.cng_booking.authentication.AuthResponse;
import com.example.cng_booking.authentication.CustomPrincipal;
import com.example.cng_booking.authentication.JwtService;
import com.example.cng_booking.authentication.MultiRoleAuthenticationToken;
import com.example.cng_booking.repositories.PumpWorkersRepo;
import com.example.cng_booking.repositories.PumpsRepo;
import com.example.cng_booking.repositories.UsersRepo;
import com.example.cng_booking.request_dtos.LoginRequestDTO;

@Service
public class AuthenticationService {

    private final AuthenticationManager authManager;
    private final JwtService jwtService;
    private final PumpsRepo pumpsRepo;
    private final PumpWorkersRepo pumpWorkersRepo;
    private final UsersRepo usersRepo;

    public AuthenticationService(
            AuthenticationManager authManager,
            JwtService jwtService,
            PumpsRepo pumpsRepo,
            PumpWorkersRepo pumpWorkersRepo,
            UsersRepo usersRepo) {
        this.authManager = authManager;
        this.jwtService = jwtService;
        this.pumpsRepo = pumpsRepo;
        this.pumpWorkersRepo = pumpWorkersRepo;
        this.usersRepo = usersRepo;
    }

    public AuthResponse login(LoginRequestDTO req) {

        Authentication auth = authManager.authenticate(
                new MultiRoleAuthenticationToken(
                        req.role(),
                        req.identifier(),
                        req.password()));

        CustomPrincipal principal = (CustomPrincipal) auth.getPrincipal();

        String token = jwtService.generateToken(
                principal.getRole(),
                principal.getUsername());

        String licenseNo = null;
        String pumpName = null;
        String workerProfileName = null;
        String role = principal.getRole().toUpperCase();
        switch (role) {
            case "USER" -> {
                var u = usersRepo.findByEmail(principal.getUsername());
                if (u != null) workerProfileName = u.getUsername();
            }
            case "PUMP_ADMIN" -> {
                licenseNo = principal.getUsername();
                pumpName = pumpsRepo.findByLicenseNo(licenseNo).getPumpName();
            }
            case "PUMP_WORKER" -> {
                var worker = pumpWorkersRepo.findByWorkerId(principal.getUsername());
                licenseNo = worker.getPump().getLicenseNo();
                pumpName = worker.getPump().getPumpName();
                workerProfileName = worker.getWorkerName();
            }
            default -> {
            }
        }

        return new AuthResponse(token, licenseNo, pumpName, workerProfileName);
    }
}
