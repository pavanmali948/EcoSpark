package com.example.cng_booking.authentication;

import java.io.IOException;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.cng_booking.services.SubscriptionService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class PumpAdminSubscriptionFilter extends OncePerRequestFilter {

    private static final Set<String> PROTECTED_PREFIXES = Set.of("/pumps", "/pump-workers");

    @Autowired
    private SubscriptionService subscriptionService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String uri = request.getRequestURI();
        // Allow pump admin to check/renew subscription even when expired
        if ("/pumps/subscription".equals(uri) || uri.startsWith("/subscription")) {
            filterChain.doFilter(request, response);
            return;
        }

        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomPrincipal principal) {
            boolean isPumpAdmin = "PUMP_ADMIN".equalsIgnoreCase(principal.getRole());
            boolean needsSubscription = PROTECTED_PREFIXES.stream().anyMatch(uri::startsWith);
            if (isPumpAdmin && needsSubscription) {
                boolean active = subscriptionService.isActiveForPumpAdmin(principal.getUsername());
                if (!active) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\":false,\"message\":\"Subscription expired\"}");
                    return;
                }
            }
        }
        filterChain.doFilter(request, response);
    }
}
