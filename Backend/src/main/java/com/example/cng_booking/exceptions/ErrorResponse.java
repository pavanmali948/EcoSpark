package com.example.cng_booking.exceptions;

import java.time.LocalDateTime;
import java.util.List;

public class ErrorResponse {

    private boolean success;
    private String message;
    List<FieldErrorDTO> errors;
    private LocalDateTime timeStamp;

    public ErrorResponse(boolean success, String message, List<FieldErrorDTO> errors, LocalDateTime timeStamp) {
        this.success = success;
        this.message = message;
        this.errors = errors;
        this.timeStamp = timeStamp;
    }

    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }

    public List<FieldErrorDTO> getErrors() {
        return errors;
    }

    public LocalDateTime getTimestamp() {
        return timeStamp;
    }
}
