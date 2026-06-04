package com.example.cng_booking.authentication;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod; // ✅ ADDED IMPORT
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;


@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final PumpAdminSubscriptionFilter pumpAdminSubscriptionFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, PumpAdminSubscriptionFilter pumpAdminSubscriptionFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.pumpAdminSubscriptionFilter = pumpAdminSubscriptionFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            HttpSecurity http,
            MultiRoleAuthenticationProvider multiAuthProvider) throws Exception {
        AuthenticationManagerBuilder builder =
            http.getSharedObject(AuthenticationManagerBuilder.class);

        builder.authenticationProvider(multiAuthProvider);

        return builder.build();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http.csrf(csrf -> csrf.disable());

        http.cors(cors -> cors.configurationSource(request -> {
    var corsConfig = new org.springframework.web.cors.CorsConfiguration();
    corsConfig.setAllowCredentials(true);
    // Local frontend (Vite)
    corsConfig.addAllowedOrigin("http://localhost:5173");
    corsConfig.addAllowedOrigin("http://127.0.0.1:5173");
    corsConfig.addAllowedOrigin("http://localhost:4173");
    corsConfig.addAllowedOrigin("http://127.0.0.1:4173");
    corsConfig.addAllowedHeader("*");
    corsConfig.addAllowedMethod("*");
    return corsConfig;
}));

        http.sessionManagement(sess ->
                sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        );

        http.authorizeHttpRequests(auth -> auth

                // ✅ ADDED THIS LINE (VERY IMPORTANT)
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                .requestMatchers("/auth/login").permitAll()
                .requestMatchers("/auth/register-user").permitAll()
                .requestMatchers("/auth/register-pump").permitAll()
                .requestMatchers("/auth/register-pump-workers").permitAll()
                .requestMatchers("/auth/change-password-user").permitAll()
                .requestMatchers("/ws/**").permitAll()
                .anyRequest().authenticated()
        );

        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterAfter(pumpAdminSubscriptionFilter, JwtAuthFilter.class);

        return http.build();
    }
}