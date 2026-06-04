package com.example.cng_booking.services.serviceImpl;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.cng_booking.models.Payment;
import com.example.cng_booking.models.PaymentStatus;
import com.example.cng_booking.models.SlotRecords;
import com.example.cng_booking.projections.OrderResponseDTO;
import com.example.cng_booking.projections.PaymentVerifyResponseDTO;
import com.example.cng_booking.repositories.PaymentRepo;
import com.example.cng_booking.request_dtos.CreatePaymentOrderDTO;
import com.example.cng_booking.request_dtos.RequestSlotBookDTO;
import com.example.cng_booking.request_dtos.VerifyPaymentDTO;
import com.example.cng_booking.services.PaymentService;
import com.example.cng_booking.services.QRService;
import com.example.cng_booking.services.RazorpayGatewayService;
import com.example.cng_booking.services.SlotRecordsService;

@Service
public class PaymentServiceImpl implements PaymentService {

    @Autowired
    private RazorpayGatewayService razorpayGatewayService;

    @Autowired
    private PaymentRepo paymentRepo;

    @Autowired
    private SlotRecordsService slotRecordsService;

    @Autowired
    private QRService qrService;

    @Override
    public OrderResponseDTO createOrder(CreatePaymentOrderDTO req) {
        String receipt = "slot_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
        OrderResponseDTO order = razorpayGatewayService.createOrder(req.amount(), receipt);

        Payment payment = new Payment();
        payment.setAmount(req.amount());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setOrderId(order.orderId());
        payment.setCustomerId(req.customerId());
        payment.setSlotId(req.slotId());
        paymentRepo.save(payment);
        return order;
    }

    @Override
    public PaymentVerifyResponseDTO verifyPayment(VerifyPaymentDTO req) {
        Payment payment = paymentRepo.findByOrderId(req.orderId()).orElseGet(Payment::new);
        payment.setOrderId(req.orderId());
        payment.setPaymentId(req.paymentId());
        payment.setSignature(req.signature());
        payment.setCustomerId(req.customerId());
        payment.setSlotId(req.slotId());

        boolean valid = razorpayGatewayService.verifySignature(req.orderId(), req.paymentId(), req.signature());
        if (!valid) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepo.save(payment);
            return new PaymentVerifyResponseDTO(null, null, PaymentStatus.FAILED.name());
        }

        RequestSlotBookDTO bookingReq = new RequestSlotBookDTO(
                req.slotId(),
                req.customerId(),
                req.licenseNo(),
                req.paymentId(),
                req.vehicleNumber());
        SlotRecords booking = slotRecordsService.createSlotRecordAfterPayment(bookingReq);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setBookingId(booking.getSlotId());
        paymentRepo.save(payment);
        String qrCodeBase64 = qrService.generateBase64(booking.getQrCode());
        return new PaymentVerifyResponseDTO(booking.getSlotId(), qrCodeBase64, PaymentStatus.SUCCESS.name());
    }
}
