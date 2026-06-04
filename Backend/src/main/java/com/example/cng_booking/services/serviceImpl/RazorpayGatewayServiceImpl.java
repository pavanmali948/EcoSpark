package com.example.cng_booking.services.serviceImpl;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.cng_booking.exceptions.BadRequestException;
import com.example.cng_booking.projections.OrderResponseDTO;
import com.example.cng_booking.services.RazorpayGatewayService;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;

@Service
public class RazorpayGatewayServiceImpl implements RazorpayGatewayService {

    @Value("${razorpay.key}")
    private String key;

    @Value("${razorpay.secret}")
    private String secret;

    @Override
    public OrderResponseDTO createOrder(Double amount, String receiptId) {
        try {
            if (key == null || key.isBlank() || secret == null || secret.isBlank()) {
                throw new BadRequestException("Razorpay key/secret missing in application.properties");
            }
            if (amount == null || amount <= 0) {
                throw new BadRequestException("amount must be > 0");
            }
            RazorpayClient client = new RazorpayClient(key, secret);
            JSONObject options = new JSONObject();
            options.put("amount", Math.round(amount * 100));
            options.put("currency", "INR");
            options.put("receipt", receiptId);
            Order order = client.orders.create(options);
            Object idValue = order.get("id");
            Object amountValue = order.get("amount");
            String orderId = idValue == null ? null : idValue.toString();
            Number amountNumber = (Number) amountValue;
            Long orderAmount = amountNumber.longValue();
            return new OrderResponseDTO(orderId, orderAmount, key);
        } catch (Exception e) {
            String msg = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
            throw new BadRequestException("Razorpay create order failed: " + msg, e);
        }
    }

    @Override
    public boolean verifySignature(String orderId, String paymentId, String signature) {
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", orderId);
            attributes.put("razorpay_payment_id", paymentId);
            attributes.put("razorpay_signature", signature);
            return Utils.verifyPaymentSignature(attributes, secret);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String getPublicKey() {
        return key;
    }
}
