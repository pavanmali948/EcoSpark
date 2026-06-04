package com.example.cng_booking.controllers;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cng_booking.projections.ApiResponse;
import com.example.cng_booking.projections.PumpAdminManageDTO;
import com.example.cng_booking.projections.SubscriptionModelDTO;
import com.example.cng_booking.projections.SuperAdminDashboardDTO;
import com.example.cng_booking.projections.SuperAdminPumpSubscriptionDTO;
import com.example.cng_booking.projections.SuperAdminUserDTO;
import com.example.cng_booking.projections.SystemReportDTO;
import com.example.cng_booking.request_dtos.AssignPumpSubscriptionDTO;
import com.example.cng_booking.request_dtos.CreatePumpAdminBySuperAdminDTO;
import com.example.cng_booking.request_dtos.UpdatePumpAdminBySuperAdminDTO;
import com.example.cng_booking.services.SuperAdminService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/super-admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class SuperAdminController {

    @Autowired
    private SuperAdminService superAdminService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<SuperAdminDashboardDTO>> getDashboard() {
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Fetched super admin dashboard",
                superAdminService.getDashboard(),
                LocalDateTime.now()));
    }

    @GetMapping("/pump-subscriptions")
    public ResponseEntity<ApiResponse<List<SuperAdminPumpSubscriptionDTO>>> getPumpSubscriptions() {
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Fetched pump subscriptions",
                superAdminService.getPumpSubscriptions(),
                LocalDateTime.now()));
    }

    @GetMapping("/subscription-models")
    public ResponseEntity<ApiResponse<List<SubscriptionModelDTO>>> getSubscriptionModels() {
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Fetched subscription models",
                superAdminService.getSubscriptionModels(),
                LocalDateTime.now()));
    }

    @PutMapping("/pump-subscriptions/{licenseNo}")
    public ResponseEntity<ApiResponse<String>> assignPumpSubscription(
            @PathVariable String licenseNo,
            @Valid @RequestBody AssignPumpSubscriptionDTO req) {
        superAdminService.assignSubscriptionToPump(licenseNo, req.subsId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Subscription assigned", licenseNo, LocalDateTime.now()));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<SuperAdminUserDTO>>> getUsers() {
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Fetched users",
                superAdminService.getAllUsers(),
                LocalDateTime.now()));
    }

    @GetMapping("/pump-admins")
    public ResponseEntity<ApiResponse<List<PumpAdminManageDTO>>> getPumpAdmins() {
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Fetched pump admins",
                superAdminService.getPumpAdmins(),
                LocalDateTime.now()));
    }

    @PostMapping("/pump-admins")
    public ResponseEntity<ApiResponse<String>> createPumpAdmin(
            @Valid @RequestBody CreatePumpAdminBySuperAdminDTO req) {
        String id = superAdminService.createPumpAdmin(req);
        return ResponseEntity.ok(new ApiResponse<>(true, "Pump admin created", id, LocalDateTime.now()));
    }

    @PutMapping("/pump-admins/{licenseNo}")
    public ResponseEntity<ApiResponse<String>> updatePumpAdmin(
            @PathVariable String licenseNo,
            @Valid @RequestBody UpdatePumpAdminBySuperAdminDTO req) {
        superAdminService.updatePumpAdmin(licenseNo, req);
        return ResponseEntity.ok(new ApiResponse<>(true, "Pump admin updated", licenseNo, LocalDateTime.now()));
    }

    @DeleteMapping("/pump-admins/{licenseNo}")
    public ResponseEntity<ApiResponse<String>> deletePumpAdmin(@PathVariable String licenseNo) {
        superAdminService.deletePumpAdmin(licenseNo);
        return ResponseEntity.ok(new ApiResponse<>(true, "Pump admin deleted", licenseNo, LocalDateTime.now()));
    }

    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<SystemReportDTO>> getSystemReport(
            @RequestParam String fromDate,
            @RequestParam String toDate) {
        SystemReportDTO report = superAdminService.generateSystemReport(
                LocalDate.parse(fromDate),
                LocalDate.parse(toDate));
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Report generated",
                report,
                LocalDateTime.now()));
    }

}
