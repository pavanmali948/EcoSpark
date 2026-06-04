package com.example.cng_booking.services;

import java.util.List;

import com.example.cng_booking.projections.OrderResponseDTO;
import com.example.cng_booking.projections.SubscriptionPlanDTO;
import com.example.cng_booking.projections.SubscriptionStatusDTO;
import com.example.cng_booking.request_dtos.CreateSubscriptionPlanDTO;
import com.example.cng_booking.request_dtos.CreateSubscriptionOrderDTO;
import com.example.cng_booking.request_dtos.VerifySubscriptionPaymentDTO;

public interface SubscriptionService {
    List<SubscriptionPlanDTO> getPlans();
    SubscriptionPlanDTO createPlan(CreateSubscriptionPlanDTO req);
    SubscriptionStatusDTO getCurrentSubscription(String pumpAdminId);
    OrderResponseDTO createOrder(CreateSubscriptionOrderDTO req);
    SubscriptionStatusDTO verifyPayment(VerifySubscriptionPaymentDTO req);
    boolean isActiveForPumpAdmin(String pumpAdminId);
}
