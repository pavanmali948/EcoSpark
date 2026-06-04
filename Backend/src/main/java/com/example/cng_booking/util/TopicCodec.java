package com.example.cng_booking.util;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

public final class TopicCodec {

    private TopicCodec() {
    }

    public static String encodeForTopic(String raw) {
        if (raw == null) {
            return "";
        }
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }
}
