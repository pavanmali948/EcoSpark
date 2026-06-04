package com.example.cng_booking.authentication;

import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.cng_booking.exceptions.UnauthorizedException;
import com.example.cng_booking.services.CustomDetailsService;

@Component
public class MultiRoleAuthenticationProvider implements AuthenticationProvider {

    private final CustomDetailsService customDetailsService;
    private final PasswordEncoder passwordEncoder;

    public MultiRoleAuthenticationProvider(CustomDetailsService customDetailsService,
            PasswordEncoder passwordEncoder) {
        this.customDetailsService = customDetailsService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Authentication authenticate(Authentication authentication) {
        MultiRoleAuthenticationToken token = (MultiRoleAuthenticationToken) authentication;

        String role = token.getRole();
        String id = token.getId();
        String rawPassword = token.getPassword();

        CustomPrincipal principal = (CustomPrincipal) customDetailsService.loadUser(id, role);

        if (!passwordEncoder.matches(rawPassword, principal.getPassword())) {
            throw new UnauthorizedException("Invalid password");
        }

        return new MultiRoleAuthenticationToken(principal, role, principal.getAuthorities());
    }

    @Override
    public boolean supports(Class<?> authentication) {
        return MultiRoleAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
