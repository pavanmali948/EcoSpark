package com.example.cng_booking.services.serviceImpl;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.cng_booking.exceptions.BadRequestException;
import com.example.cng_booking.models.Pumps;
import com.example.cng_booking.models.Subscription;
import com.example.cng_booking.models.SubscriptionPlan;
import com.example.cng_booking.models.SubscriptionStatus;
import com.example.cng_booking.projections.OrderResponseDTO;
import com.example.cng_booking.projections.SubscriptionPlanDTO;
import com.example.cng_booking.projections.SubscriptionStatusDTO;
import com.example.cng_booking.request_dtos.CreateSubscriptionPlanDTO;
import com.example.cng_booking.repositories.PumpsRepo;
import com.example.cng_booking.repositories.SubscriptionPlanRepo;
import com.example.cng_booking.repositories.SubscriptionRepo;
import com.example.cng_booking.request_dtos.CreateSubscriptionOrderDTO;
import com.example.cng_booking.request_dtos.VerifySubscriptionPaymentDTO;
import com.example.cng_booking.services.RazorpayGatewayService;
import com.example.cng_booking.services.SubscriptionService;

@Service
public class SubscriptionServiceImpl implements SubscriptionService {

    private static final ZoneId PLATFORM_TZ = ZoneId.of("Asia/Kolkata");

    @Autowired
    private SubscriptionPlanRepo subscriptionPlanRepo;

    @Autowired
    private SubscriptionRepo subscriptionRepo;

    @Autowired
    private PumpsRepo pumpsRepo;

    @Autowired
    private RazorpayGatewayService razorpayGatewayService;

    @Override
    public List<SubscriptionPlanDTO> getPlans() {
        ensureDefaultPlans();
        return subscriptionPlanRepo.findAll().stream()
                .map(p -> new SubscriptionPlanDTO(p.getId(), p.getName(), p.getPrice(), p.getDurationDays()))
                .toList();
    }

    @Override
    public SubscriptionPlanDTO createPlan(CreateSubscriptionPlanDTO req) {
        if (subscriptionPlanRepo.existsByNameIgnoreCase(req.name().trim())) {
            throw new BadRequestException("Plan with this name already exists");
        }
        SubscriptionPlan plan = new SubscriptionPlan();
        plan.setName(req.name().trim());
        plan.setPrice(req.price());
        plan.setDurationDays(req.durationDays());
        SubscriptionPlan saved = subscriptionPlanRepo.save(plan);
        return new SubscriptionPlanDTO(saved.getId(), saved.getName(), saved.getPrice(), saved.getDurationDays());
    }

    @Override
    public SubscriptionStatusDTO getCurrentSubscription(String pumpAdminId) {
        var subOpt = subscriptionRepo.findTopByPumpAdminIdOrderByEndDateDesc(pumpAdminId);
        if (subOpt.isEmpty()) {
            return new SubscriptionStatusDTO(null, null, null, null, SubscriptionStatus.EXPIRED);
        }
        Subscription subscription = subOpt.get();
        SubscriptionPlan plan = subscriptionPlanRepo.findById(subscription.getPlanId()).orElse(null);
        SubscriptionStatus status = subscription.getEndDate().isAfter(LocalDateTime.now(PLATFORM_TZ))
                ? SubscriptionStatus.ACTIVE
                : SubscriptionStatus.EXPIRED;
        if (subscription.getStatus() != status) {
            subscription.setStatus(status);
            subscriptionRepo.save(subscription);
        }
        return new SubscriptionStatusDTO(
                subscription.getId(),
                plan == null ? null : plan.getName(),
                subscription.getStartDate(),
                subscription.getEndDate(),
                status);
    }

    @Override
    public OrderResponseDTO createOrder(CreateSubscriptionOrderDTO req) {
        SubscriptionPlan plan = subscriptionPlanRepo.findById(req.planId())
                .orElseThrow(() -> new BadRequestException("Subscription plan not found"));
        if (!pumpsRepo.existsByLicenseNo(req.pumpAdminId())) {
            throw new BadRequestException("Pump admin not found");
        }
        String receipt = "subs_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
        return razorpayGatewayService.createOrder(plan.getPrice(), receipt);
    }

    @Override
    public SubscriptionStatusDTO verifyPayment(VerifySubscriptionPaymentDTO req) {
        SubscriptionPlan plan = subscriptionPlanRepo.findById(req.planId())
                .orElseThrow(() -> new BadRequestException("Subscription plan not found"));

        boolean valid = razorpayGatewayService.verifySignature(req.orderId(), req.paymentId(), req.signature());
        if (!valid) {
            throw new BadRequestException("Invalid payment signature");
        }

        LocalDateTime now = LocalDateTime.now(PLATFORM_TZ);
        Subscription subscription = new Subscription();
        subscription.setPumpAdminId(req.pumpAdminId());
        subscription.setPlanId(plan.getId());
        subscription.setStartDate(now);
        subscription.setEndDate(now.plusDays(plan.getDurationDays()));
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        Subscription saved = subscriptionRepo.save(subscription);

        Pumps pump = pumpsRepo.findByLicenseNo(req.pumpAdminId());
        if (pump != null) {
            pump.setSubscriptionStartDate(now.toLocalDate());
            pumpsRepo.save(pump);
        }

        return new SubscriptionStatusDTO(
                saved.getId(),
                plan.getName(),
                saved.getStartDate(),
                saved.getEndDate(),
                saved.getStatus());
    }

    @Override
    public boolean isActiveForPumpAdmin(String pumpAdminId) {
        SubscriptionStatusDTO current = getCurrentSubscription(pumpAdminId);
        return current.status() == SubscriptionStatus.ACTIVE;
    }

    private void ensureDefaultPlans() {
        if (subscriptionPlanRepo.count() > 0) return;
        SubscriptionPlan basic = new SubscriptionPlan();
        basic.setName("Basic");
        basic.setPrice(999.0);
        basic.setDurationDays(30);
        SubscriptionPlan premium = new SubscriptionPlan();
        premium.setName("Premium");
        premium.setPrice(2499.0);
        premium.setDurationDays(90);
        subscriptionPlanRepo.save(basic);
        subscriptionPlanRepo.save(premium);
    }
}
