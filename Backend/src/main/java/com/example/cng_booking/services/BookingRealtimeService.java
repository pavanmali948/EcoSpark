package com.example.cng_booking.services;

import java.util.Map;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.example.cng_booking.util.TopicCodec;

@Service
public class BookingRealtimeService {

    private final SimpMessagingTemplate messagingTemplate;

    public BookingRealtimeService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void notifyPumpUpdated(String licenseNo) {
        if (licenseNo == null || licenseNo.isBlank()) {
            return;
        }
        String enc = TopicCodec.encodeForTopic(licenseNo);
        messagingTemplate.convertAndSend(
                "/topic/pump/" + enc + "/updates",
                Map.of("type", "PUMP_UPDATED", "licenseNo", licenseNo));
    }
}
