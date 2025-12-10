package com.nicolas.chatapp.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Slf4j
@Service
public class TokenProvider {

    private final SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(JwtConstants.SECRET_KEY));
    private final JwtParser jwtParser;

    public TokenProvider() {
        this.jwtParser = Jwts.parser()
                .verifyWith(key)
                .build();
    }

    public String generateToken(Authentication authentication) {
        log.info("Generating access token");
        String identifier = authentication.getName();
        var builder = Jwts.builder()
                .issuer(JwtConstants.ISSUER)
                .issuedAt(new Date())
                .expiration(new Date(new Date().getTime() + JwtConstants.ACCESS_TOKEN_VALIDITY));
        
        // Support both email and phone number
        if (identifier.contains("@")) {
            builder.claim(JwtConstants.EMAIL, identifier);
        } else {
            builder.claim(JwtConstants.PHONE_NUMBER, identifier);
        }
        
        return builder.signWith(key, Jwts.SIG.HS256).compact();
    }

    public String generateRefreshToken(Authentication authentication) {
        log.info("Generating refresh token");
        String identifier = authentication.getName();
        var builder = Jwts.builder()
                .issuer(JwtConstants.ISSUER)
                .issuedAt(new Date())
                .expiration(new Date(new Date().getTime() + JwtConstants.REFRESH_TOKEN_VALIDITY));
        
        // Support both email and phone number
        if (identifier.contains("@")) {
            builder.claim(JwtConstants.EMAIL, identifier);
        } else {
            builder.claim(JwtConstants.PHONE_NUMBER, identifier);
        }
        
        return builder.signWith(key, Jwts.SIG.HS256).compact();
    }

    public String generateTokenFromRefreshToken(String refreshToken) {
        Claims claims = getClaimsFromToken(refreshToken);
        String email = claims.get(JwtConstants.EMAIL, String.class);
        String phoneNumber = claims.get(JwtConstants.PHONE_NUMBER, String.class);
        String identifier = email != null ? email : phoneNumber;
        
        var builder = Jwts.builder()
                .issuer(JwtConstants.ISSUER)
                .issuedAt(new Date())
                .expiration(new Date(new Date().getTime() + JwtConstants.ACCESS_TOKEN_VALIDITY));
        
        if (identifier != null && identifier.contains("@")) {
            builder.claim(JwtConstants.EMAIL, identifier);
        } else if (identifier != null) {
            builder.claim(JwtConstants.PHONE_NUMBER, identifier);
        }
        
        return builder.signWith(key, Jwts.SIG.HS256).compact();
    }

    public Claims getClaimsFromToken(String jwt) {
        jwt = jwt.substring(JwtConstants.TOKEN_PREFIX.length());
        return jwtParser.parseSignedClaims(jwt).getPayload();
    }

}
