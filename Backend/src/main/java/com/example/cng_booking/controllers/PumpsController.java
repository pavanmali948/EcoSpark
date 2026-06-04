package com.example.cng_booking.controllers;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cng_booking.exceptions.UnauthorizedException;
import com.example.cng_booking.models.SlotIntervals;
import com.example.cng_booking.projections.ApiResponse;
import com.example.cng_booking.projections.PumpResponseDTO;
import com.example.cng_booking.projections.PumpSettingsDTO;
import com.example.cng_booking.projections.PumpSubscriptionDTO;
import com.example.cng_booking.projections.SlotResponseDTO;
import com.example.cng_booking.request_dtos.RequestCreateSlotIntervalDTO;
import com.example.cng_booking.request_dtos.UpdatePumpSettingsDTO;
import com.example.cng_booking.services.PumpContextService;
import com.example.cng_booking.services.PumpsService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/pumps")
public class PumpsController {
    
    @Autowired
    private PumpsService pumpsService;

    @Autowired
    private PumpContextService pumpContextService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PumpResponseDTO>>> getAllPumps() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Successfully fetched pumps", pumpsService.getAllPumps(), LocalDateTime.now()));
    }

    @GetMapping("/{pumpId}/slots")
    public ResponseEntity<ApiResponse<List<SlotResponseDTO>>> getPumpSlots(@PathVariable String pumpId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Successfully fetched slots", pumpsService.getPumpSlots(pumpId), LocalDateTime.now()));
    }

    @GetMapping("/slots")
    public ResponseEntity<ApiResponse<List<SlotIntervals>>> getAllSlotIntervals() {
        String licenseNo = pumpContextService.resolvePumpLicenseForStaff();
        return ResponseEntity.ok(new ApiResponse<>(true, "Successfully fetched slot intervals", pumpsService.getAllSlotIntervals(licenseNo), LocalDateTime.now()));
    }

    @PostMapping("/slots")
    public ResponseEntity<ApiResponse<String>> createSlotInterval(@Valid @RequestBody RequestCreateSlotIntervalDTO req) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String authority = auth.getAuthorities().iterator().next().getAuthority();
        if (!"ROLE_PUMP_ADMIN".equals(authority)) {
            throw new UnauthorizedException("Only pump admin can create slots");
        }
        String licenseNo = pumpContextService.resolvePumpLicenseForStaff();
        pumpsService.createSlotInterval(req, licenseNo);
        return ResponseEntity.ok(new ApiResponse<>(true, "Slot interval created successfully", null, LocalDateTime.now()));
    }

    @GetMapping("/settings")
    public ResponseEntity<ApiResponse<PumpSettingsDTO>> getPumpSettings() {
        String licenseNo = pumpContextService.resolvePumpLicenseForStaff();
        return ResponseEntity.ok(new ApiResponse<>(true, "Successfully fetched pump settings", pumpsService.getPumpSettings(licenseNo), LocalDateTime.now()));
    }

    @PutMapping("/settings")
    public ResponseEntity<ApiResponse<PumpSettingsDTO>> updatePumpSettings(@Valid @RequestBody UpdatePumpSettingsDTO req) {
        String licenseNo = pumpContextService.resolvePumpLicenseForStaff();
        return ResponseEntity.ok(new ApiResponse<>(true, "Pump settings updated", pumpsService.updatePumpSettings(licenseNo, req), LocalDateTime.now()));
    }

    @GetMapping("/subscription")
    public ResponseEntity<ApiResponse<PumpSubscriptionDTO>> getPumpSubscription() {
        String licenseNo = pumpContextService.resolvePumpLicenseForStaff();
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Successfully fetched pump subscription",
                pumpsService.getPumpSubscription(licenseNo),
                LocalDateTime.now()));
    }
}
