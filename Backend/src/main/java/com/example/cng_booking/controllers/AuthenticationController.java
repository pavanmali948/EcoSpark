package com.example.cng_booking.controllers;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cng_booking.authentication.AuthResponse;
import com.example.cng_booking.projections.ApiResponse;
import com.example.cng_booking.request_dtos.LoginRequestDTO;
import com.example.cng_booking.request_dtos.RegisterPumpAdminDTO;
import com.example.cng_booking.request_dtos.RegisterPumpWorkerDTO;
import com.example.cng_booking.request_dtos.RegisterUserDTO;
import com.example.cng_booking.request_dtos.ChangeUserPasswordDTO;
import com.example.cng_booking.services.AuthenticationService;
import com.example.cng_booking.services.PumpWorkersService;
import com.example.cng_booking.services.PumpsService;
import com.example.cng_booking.services.UsersService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthenticationController {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationController.class);

    @Autowired
    private UsersService usersService;

    @Autowired
    private PumpsService pumpsService;

    @Autowired
    private PumpWorkersService pumpWorkersService;

    @Autowired
    private AuthenticationService authenticationService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequestDTO req) {
        AuthResponse authRes = authenticationService.login(req);
        ApiResponse<AuthResponse> response = new ApiResponse<AuthResponse>(
            true, 
            "Login successful", 
            authRes, 
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
    
    @PostMapping("/register-user")
    public ResponseEntity<ApiResponse<String>> registerUser(@Valid @RequestBody RegisterUserDTO req) {
        log.info("POST /auth/register-user — username={}, email={}", req.username(), req.email());
        try {
            String userId = usersService.createUser(req);
            log.info("User registered successfully — userId={}", userId);
            ApiResponse<String> response = new ApiResponse<String>(
                true,
                "User registered successfully",
                userId,
                LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception ex) {
            log.error("register-user failed for email={}", req.email(), ex);
            throw ex;
        }
    }

    @PostMapping("/register-pump")
    public ResponseEntity<ApiResponse<String>> registerPumpAdmin(@Valid @RequestBody RegisterPumpAdminDTO req) {
        String licenseNo = pumpsService.createPump(req);
        ApiResponse<String> response = new ApiResponse<String>(
            true, 
            "Pump registered successfully", 
            licenseNo, 
            LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/register-pump-workers")
    public ResponseEntity<ApiResponse<String>> registerPumpWorker(@Valid @RequestBody RegisterPumpWorkerDTO req) {
        String workerId = pumpWorkersService.createPumpWorker(req);
        ApiResponse<String> response = new ApiResponse<String>(
            true, 
            "Pump Workers registered successfully", 
            workerId, 
            LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/change-password-user")
    public ResponseEntity<ApiResponse<String>> changeUserPassword(@Valid @RequestBody ChangeUserPasswordDTO req) {
        usersService.changeUserPassword(req.identifier(), req.currentPassword(), req.newPassword());
        ApiResponse<String> response = new ApiResponse<String>(
                true,
                "Password changed successfully",
                req.identifier(),
                LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}
