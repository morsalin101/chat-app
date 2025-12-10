package com.nicolas.chatapp.controllers;

import com.nicolas.chatapp.config.JwtConstants;
import com.nicolas.chatapp.config.TokenProvider;
import com.nicolas.chatapp.dto.request.LoginRequestDTO;
import com.nicolas.chatapp.dto.request.OtpSignupRequestDTO;
import com.nicolas.chatapp.dto.request.UpdateUserRequestDTO;
import com.nicolas.chatapp.dto.response.LoginResponseDTO;
import com.nicolas.chatapp.dto.response.SignupResponseDTO;
import com.nicolas.chatapp.exception.UserException;
import com.nicolas.chatapp.model.User;
import com.nicolas.chatapp.repository.OtpRepository;
import com.nicolas.chatapp.repository.UserRepository;
import com.nicolas.chatapp.service.OtpService;
import com.nicolas.chatapp.service.implementation.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@Slf4j
@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

    private final TokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CustomUserDetailsService customUserDetailsService;
    private final OtpService otpService;

    @PostMapping("/signup")
    public ResponseEntity<SignupResponseDTO> signup(@RequestBody UpdateUserRequestDTO signupRequestDTO) throws UserException {

        final String email = signupRequestDTO.email();
        final String password = signupRequestDTO.password();
        final String fullName = signupRequestDTO.fullName();

        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            throw new UserException("Account with email " + email + " already exists");
        }

        User newUser = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .fullName(fullName)
                // OTP VERIFICATION DISABLED - Auto-set to true
                .otpVerified(true) // OTP verification required - starts as null
                .build();

        User savedUser = userRepository.save(newUser);

        Authentication authentication = new UsernamePasswordAuthenticationToken(email, password);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        SignupResponseDTO signupResponseDTO = SignupResponseDTO.builder()
                .token(jwt)
                .isAuthenticated(true)
                .userId(savedUser.getId())
                // OTP VERIFICATION DISABLED
                .requiresOtpVerification(false) // true
                .build();

        log.info("User {} successfully signed up, requires OTP verification", email);

        return new ResponseEntity<>(signupResponseDTO, HttpStatus.ACCEPTED);
    }

    @PostMapping("/signin")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody LoginRequestDTO loginRequestDTO) {

        final String email = loginRequestDTO.email();
        final String password = loginRequestDTO.password();

        Authentication authentication = authenticateReq(email, password);
        
        // OTP VERIFICATION DISABLED - Login allowed without OTP check
        /* Check if OTP is verified - only allow login if otpVerified is true
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            // Block login if otpVerified is null (not verified) or false (verification failed)
            // Only allow if otpVerified is explicitly true
            if (user.getOtpVerified() == null || !user.getOtpVerified()) {
                throw new BadCredentialsException("Please verify your phone number with OTP first. You can manually set otpVerified to true in database if needed.");
            }
        }
        */
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        String refreshToken = tokenProvider.generateRefreshToken(authentication);
        boolean isProfileComplete = checkProfileComplete(email);

        LoginResponseDTO loginResponseDTO = LoginResponseDTO.builder()
                .token(jwt)
                .refreshToken(refreshToken)
                .isAuthenticated(true)
                .isProfileComplete(isProfileComplete)
                .build();

        log.info("User {} successfully signed in", loginRequestDTO.email());

        return new ResponseEntity<>(loginResponseDTO, HttpStatus.ACCEPTED);
    }

    @PostMapping("/signup/otp")
    public ResponseEntity<LoginResponseDTO> signupWithOtp(@RequestBody OtpSignupRequestDTO request) throws UserException {
        // Verify OTP first
        boolean isOtpValid = otpService.verifyOtp(request.phoneNumber(), request.otpCode());
        if (!isOtpValid) {
            throw new UserException("Invalid or expired OTP");
        }

        // Check if user already exists
        Optional<User> existingUser = userRepository.findByPhoneNumber(request.phoneNumber());
        if (existingUser.isPresent()) {
            throw new UserException("User with phone number " + request.phoneNumber() + " already exists");
        }

        // Create new user
        User newUser = User.builder()
                .phoneNumber(request.phoneNumber())
                .fullName(request.fullName())
                .isOnline(true)
                .build();

        userRepository.save(newUser);

        // Delete verified OTP
        otpService.deleteVerifiedOtp(request.phoneNumber());

        // Generate tokens
        Authentication authentication = new UsernamePasswordAuthenticationToken(request.phoneNumber(), null);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(authentication);

        LoginResponseDTO loginResponseDTO = LoginResponseDTO.builder()
                .token(jwt)
                .refreshToken(refreshToken)
                .isAuthenticated(true)
                .isProfileComplete(false) // Profile not complete yet
                .build();

        log.info("User {} successfully signed up with OTP", request.phoneNumber());

        return new ResponseEntity<>(loginResponseDTO, HttpStatus.ACCEPTED);
    }

    @PostMapping("/login/otp")
    public ResponseEntity<LoginResponseDTO> loginWithOtp(@RequestBody OtpSignupRequestDTO request) throws UserException {
        // Verify OTP
        boolean isOtpValid = otpService.verifyOtp(request.phoneNumber(), request.otpCode());
        if (!isOtpValid) {
            throw new UserException("Invalid or expired OTP");
        }

        // Find user
        Optional<User> userOptional = userRepository.findByPhoneNumber(request.phoneNumber());
        if (userOptional.isEmpty()) {
            throw new UserException("User not found. Please sign up first.");
        }

        User user = userOptional.get();
        user.setIsOnline(true);
        userRepository.save(user);

        // Delete verified OTP
        otpService.deleteVerifiedOtp(request.phoneNumber());

        // Generate tokens
        Authentication authentication = new UsernamePasswordAuthenticationToken(request.phoneNumber(), null);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(authentication);
        boolean isProfileComplete = checkProfileComplete(user.getEmail() != null ? user.getEmail() : request.phoneNumber());

        LoginResponseDTO loginResponseDTO = LoginResponseDTO.builder()
                .token(jwt)
                .refreshToken(refreshToken)
                .isAuthenticated(true)
                .isProfileComplete(isProfileComplete)
                .build();

        log.info("User {} successfully logged in with OTP", request.phoneNumber());

        return new ResponseEntity<>(loginResponseDTO, HttpStatus.ACCEPTED);
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponseDTO> refreshToken(@RequestHeader(JwtConstants.REFRESH_TOKEN_HEADER) String refreshToken) {
        try {
            String newAccessToken = tokenProvider.generateTokenFromRefreshToken(refreshToken);
            
            LoginResponseDTO loginResponseDTO = LoginResponseDTO.builder()
                    .token(newAccessToken)
                    .refreshToken(refreshToken) // Return same refresh token
                    .isAuthenticated(true)
                    .isProfileComplete(true) // Assume complete if refresh works
                    .build();

            return new ResponseEntity<>(loginResponseDTO, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error refreshing token: {}", e.getMessage());
            throw new BadCredentialsException("Invalid refresh token");
        }
    }

    private boolean checkProfileComplete(String identifier) {
        Optional<User> userOptional;
        if (identifier.contains("@")) {
            userOptional = userRepository.findByEmail(identifier);
        } else {
            userOptional = userRepository.findByPhoneNumber(identifier);
        }
        
        if (userOptional.isEmpty()) {
            return false;
        }
        
        User user = userOptional.get();
        return user.getFullName() != null && !user.getFullName().isEmpty() 
                && user.getProfilePicture() != null && !user.getProfilePicture().isEmpty();
    }

    public Authentication authenticateReq(String username, String password) {

        UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);

        if (userDetails == null) {
            throw new BadCredentialsException("Invalid username");
        }

        if (!passwordEncoder.matches(password, userDetails.getPassword())) {
            throw new BadCredentialsException("Invalid Password");
        }

        return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
    }

}
