package com.example.cng_booking.authentication;

import java.util.Collection;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

public class MultiRoleAuthenticationToken extends AbstractAuthenticationToken {
    
    private final String role;
    private final String id;
    private final String password;
    private final Object principal;

    // Constructor BEFORE authentication
    public MultiRoleAuthenticationToken(String role, String id, String password) {
        super(null);
        this.role = role;
        this.id = id;
        this.password = password;
        this.principal = null;
        setAuthenticated(false);
    }

    // Constructor AFTER authentication
    public MultiRoleAuthenticationToken(Object principal, String role,
                                        Collection<? extends GrantedAuthority> authorities) {
        super(authorities);
        this.role = role;
        this.id = null;
        this.password = null;
        this.principal = principal;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return password;
    }

    @Override
    public Object getPrincipal() {
        return principal;
    }

    public String getPassword() {
        return password;
    }

    public String getRole() {
        return role;
    }

    public String getId() {
        return id;
    }
}
