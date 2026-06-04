package com.example.cng_booking.services;

import java.util.ArrayList;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.cng_booking.exceptions.BadRequestException;
import com.example.cng_booking.models.SlotRecords;
import com.example.cng_booking.models.Users;
import com.example.cng_booking.repositories.UsersRepo;
import com.example.cng_booking.request_dtos.RegisterUserDTO;

import jakarta.validation.Valid;

@Service
public class UsersService {

    private static final Logger log = LoggerFactory.getLogger(UsersService.class);

    @Autowired
    private UsersRepo usersRepo;

    @Autowired
    PasswordEncoder encoder;

    public String createUser(@Valid RegisterUserDTO req) {
        log.debug("createUser start — username={}, email={}", req.username(), req.email());

        if (req == null) {
            throw new BadRequestException("Bad request");
        }
        if (usersRepo.existsByEmail(req.email())) {
            log.warn("createUser rejected — email already in use: {}", req.email());
            throw new BadRequestException("email already in use");
        }

        Users reqUser = new Users(
            req.username(),
            req.email(),
            encoder.encode(req.password()),
            new ArrayList<SlotRecords>()
        );

        log.debug("createUser saving entity to database");
        Users user = usersRepo.save(reqUser);
        log.info("createUser success — userId={}", user.getUserId());
        return user.getUserId();
    }

    public Users getUserObj(String userIdOrEmail) {

        if (userIdOrEmail == null || userIdOrEmail.isEmpty()) {
            throw new BadRequestException("userId is null or empty");
        }
        if (usersRepo.existsByUserId(userIdOrEmail)) {
            return usersRepo.findByUserId(userIdOrEmail);
        }
        Users byEmail = usersRepo.findByEmail(userIdOrEmail);
        if (byEmail != null) {
            return byEmail;
        }
        throw new BadRequestException("user does not exist");
    }

    public void changeUserPassword(String identifier, String currentPassword, String newPassword) {
        if (identifier == null || identifier.isBlank()) {
            throw new BadRequestException("identifier is null or empty");
        }
        if (currentPassword == null || currentPassword.isBlank()) {
            throw new BadRequestException("currentPassword is null or empty");
        }
        if (newPassword == null || newPassword.isBlank()) {
            throw new BadRequestException("newPassword is null or empty");
        }

        Users user = getUserObj(identifier);

        if (encoder == null) {
            throw new BadRequestException("Password encoder not configured");
        }
        if (!encoder.matches(currentPassword, user.getPassword())) {
            throw new BadRequestException("currentPassword is incorrect");
        }

        user.setPassword(encoder.encode(newPassword));
        usersRepo.save(user);
    }
}
