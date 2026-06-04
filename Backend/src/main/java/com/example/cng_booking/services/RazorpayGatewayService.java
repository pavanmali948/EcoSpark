package com.example.cng_booking.services;

import com.example.cng_booking.projections.OrderResponseDTO;

public interface RazorpayGatewayService {
    OrderResponseDTO createOrder(Double amount, String receiptId);
    boolean verifySignature(String orderId, String paymentId, String signature);
    String getPublicKey();
}
