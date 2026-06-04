package com.example.cng_booking.controllers;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cng_booking.projections.ApiResponse;
import com.example.cng_booking.projections.OrderResponseDTO;
import com.example.cng_booking.projections.SubscriptionPlanDTO;
import com.example.cng_booking.projections.SubscriptionStatusDTO;
import com.example.cng_booking.request_dtos.CreateSubscriptionPlanDTO;
import com.example.cng_booking.request_dtos.CreateSubscriptionOrderDTO;
import com.example.cng_booking.request_dtos.VerifySubscriptionPaymentDTO;
import com.example.cng_booking.services.SubscriptionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/subscription")
public class SubscriptionController {

    @Autowired
    private SubscriptionService subscriptionService;

    @GetMapping("/plans")
    public ResponseEntity<ApiResponse<List<SubscriptionPlanDTO>>> getPlans() {
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Fetched plans",
                subscriptionService.getPlans(),
                LocalDateTime.now()));
    }

    @PostMapping("/plans")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<SubscriptionPlanDTO>> createPlan(@Valid @RequestBody CreateSubscriptionPlanDTO req) {
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Subscription plan created",
                subscriptionService.createPlan(req),
                LocalDateTime.now()));
    }

    @GetMapping("/current")
    @PreAuthorize("hasRole('PUMP_ADMIN')")
    public ResponseEntity<ApiResponse<SubscriptionStatusDTO>> getCurrent() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        var principal = (com.example.cng_booking.authentication.CustomPrincipal) auth.getPrincipal();
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Fetched current subscription",
                subscriptionService.getCurrentSubscription(principal.getUsername()),
                LocalDateTime.now()));
    }

    @PostMapping("/create-order")
    @PreAuthorize("hasRole('PUMP_ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponseDTO>> createOrder(@Valid @RequestBody CreateSubscriptionOrderDTO req) {
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Subscription order created",
                subscriptionService.createOrder(req),
                LocalDateTime.now()));
    }

    @PostMapping("/verify")
    @PreAuthorize("hasRole('PUMP_ADMIN')")
    public ResponseEntity<ApiResponse<SubscriptionStatusDTO>> verify(@Valid @RequestBody VerifySubscriptionPaymentDTO req) {
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Subscription activated",
                subscriptionService.verifyPayment(req),
                LocalDateTime.now()));
    }
}
