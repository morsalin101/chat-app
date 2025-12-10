package com.nicolas.chatapp.controllers;

import com.nicolas.chatapp.config.JwtConstants;
import com.nicolas.chatapp.dto.response.ApiResponseDTO;
import com.nicolas.chatapp.dto.response.UserDTO;
import com.nicolas.chatapp.exception.UserException;
import com.nicolas.chatapp.model.User;
import com.nicolas.chatapp.repository.UserRepository;
import com.nicolas.chatapp.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @GetMapping("/profile")
    public ResponseEntity<UserDTO> getUserProfile(@RequestHeader(JwtConstants.TOKEN_HEADER) String jwt) throws UserException {
        User user = userService.findUserByProfile(jwt);
        return new ResponseEntity<>(UserDTO.fromUser(user), HttpStatus.OK);
    }

    @PutMapping("/update")
    public ResponseEntity<ApiResponseDTO> updateUser(@RequestHeader(JwtConstants.TOKEN_HEADER) String jwt,
                                                      @RequestBody com.nicolas.chatapp.dto.request.UpdateUserRequestDTO request) throws UserException {
        User user = userService.findUserByProfile(jwt);
        User updatedUser = userService.updateUser(user.getId(), request);
        
        ApiResponseDTO response = ApiResponseDTO.builder()
                .message("User updated successfully")
                .status(true)
                .build();
        
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/search")
    public ResponseEntity<java.util.List<UserDTO>> searchUser(@RequestParam String name,
                                                               @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt) {
        java.util.List<User> users = userService.searchUser(name);
        return new ResponseEntity<>(UserDTO.fromUsersAsList(users), HttpStatus.OK);
    }

    // Manual OTP verification endpoint (for testing/admin purposes)
    @PutMapping("/{userId}/verify-otp")
    public ResponseEntity<ApiResponseDTO> manuallyVerifyOtp(@PathVariable UUID userId) throws UserException {
        User user = userService.findUserById(userId);
        user.setOtpVerified(true);
        userRepository.save(user);
        
        log.info("Manually verified OTP for user: {}", userId);
        
        ApiResponseDTO response = ApiResponseDTO.builder()
                .message("OTP verified manually. User can now login.")
                .status(true)
                .build();
        
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    // Manual OTP verification by email (for testing/admin purposes)
    @PutMapping("/verify-otp-by-email")
    public ResponseEntity<ApiResponseDTO> verifyOtpByEmail(@RequestParam String email) throws UserException {
        java.util.Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            throw new UserException("User not found with email: " + email);
        }
        
        User user = userOptional.get();
        user.setOtpVerified(true);
        userRepository.save(user);
        
        log.info("Manually verified OTP for user with email: {}", email);
        
        ApiResponseDTO response = ApiResponseDTO.builder()
                .message("OTP verified manually. User can now login.")
                .status(true)
                .build();
        
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
