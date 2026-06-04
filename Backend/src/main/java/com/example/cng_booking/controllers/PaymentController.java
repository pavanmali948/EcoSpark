package com.example.cng_booking.controllers;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.cng_booking.projections.ApiResponse;
import com.example.cng_booking.projections.OrderResponseDTO;
import com.example.cng_booking.projections.PaymentVerifyResponseDTO;
import com.example.cng_booking.request_dtos.CreatePaymentOrderDTO;
import com.example.cng_booking.request_dtos.VerifyPaymentDTO;
import com.example.cng_booking.services.PaymentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/payments")
@PreAuthorize("hasRole('USER')")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/create-order")
    public ResponseEntity<ApiResponse<OrderResponseDTO>> createOrder(@Valid @RequestBody CreatePaymentOrderDTO req) {
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Payment order created",
                paymentService.createOrder(req),
                LocalDateTime.now()));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<PaymentVerifyResponseDTO>> verifyPayment(@Valid @RequestBody VerifyPaymentDTO req) {
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Payment verification completed",
                paymentService.verifyPayment(req),
                LocalDateTime.now()));
    }
}
