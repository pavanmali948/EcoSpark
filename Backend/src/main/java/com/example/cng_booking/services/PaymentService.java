package com.example.cng_booking.services;

import com.example.cng_booking.projections.OrderResponseDTO;
import com.example.cng_booking.projections.PaymentVerifyResponseDTO;
import com.example.cng_booking.request_dtos.CreatePaymentOrderDTO;
import com.example.cng_booking.request_dtos.VerifyPaymentDTO;

public interface PaymentService {
    OrderResponseDTO createOrder(CreatePaymentOrderDTO req);
    PaymentVerifyResponseDTO verifyPayment(VerifyPaymentDTO req);
}
