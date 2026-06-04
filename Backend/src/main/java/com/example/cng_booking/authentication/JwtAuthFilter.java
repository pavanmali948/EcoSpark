package com.example.cng_booking.authentication;

import java.io.IOException;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.cng_booking.exceptions.UnauthorizedException;
import com.example.cng_booking.services.CustomDetailsService;

import io.micrometer.common.lang.NonNull;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomDetailsService customDetailsService;

    public JwtAuthFilter(JwtService jwtService, CustomDetailsService customDetailsService) {
        this.jwtService = jwtService;
        this.customDetailsService = customDetailsService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // No JWT in request → skip
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extract token
        String token = authHeader.substring(7);

        // Validate token
        if (!jwtService.validateToken(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extract role and id from token
        String role = jwtService.extractRole(token);
        String id = jwtService.extractId(token);

        if (role == null || id == null) {
            throw new UnauthorizedException("Invalid token claims");
        }

        // Prevent double authentication
        if (SecurityContextHolder.getContext().getAuthentication() == null) {

            // Load user based on ID + Role
            CustomPrincipal principal = (CustomPrincipal) customDetailsService.loadUser(id, role);

            // Create authenticated version of your CUSTOM TOKEN
            MultiRoleAuthenticationToken authToken = new MultiRoleAuthenticationToken(
                    principal,
                    role,
                    principal.getAuthorities());

            authToken.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        filterChain.doFilter(request, response);
    }
}
