package com.nicolas.chatapp.controllers;

import com.nicolas.chatapp.config.JwtConstants;
import com.nicolas.chatapp.dto.request.UpdateProfileRequestDTO;
import com.nicolas.chatapp.dto.response.ApiResponseDTO;
import com.nicolas.chatapp.dto.response.UserDTO;
import com.nicolas.chatapp.exception.UserException;
import com.nicolas.chatapp.model.User;
import com.nicolas.chatapp.service.FileStorageService;
import com.nicolas.chatapp.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Slf4j
@CrossOrigin
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserService userService;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<UserDTO> getProfile(@RequestHeader(JwtConstants.TOKEN_HEADER) String jwt) throws UserException {
        User user = userService.findUserByProfile(jwt);
        return new ResponseEntity<>(UserDTO.fromUser(user), HttpStatus.OK);
    }

    @PutMapping
    public ResponseEntity<UserDTO> updateProfile(
            @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt,
            @RequestBody UpdateProfileRequestDTO request) throws UserException {
        User user = userService.findUserByProfile(jwt);
        
        if (request.fullName() != null && !request.fullName().isEmpty()) {
            user.setFullName(request.fullName());
        }
        if (request.bio() != null) {
            user.setBio(request.bio());
        }
        
        User updatedUser = userService.updateUser(user);
        log.info("Profile updated for user: {}", updatedUser.getId());
        
        return new ResponseEntity<>(UserDTO.fromUser(updatedUser), HttpStatus.OK);
    }

    @PostMapping("/picture")
    public ResponseEntity<ApiResponseDTO> uploadProfilePicture(
            @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt,
            @RequestParam("file") MultipartFile file) throws UserException, IOException {
        
        User user = userService.findUserByProfile(jwt);
        
        // Delete old profile picture if exists
        if (user.getProfilePicture() != null && !user.getProfilePicture().isEmpty()) {
            fileStorageService.deleteFile(user.getProfilePicture());
        }
        
        // Save new profile picture
        String filePath = fileStorageService.storeFile(file, "profiles");
        user.setProfilePicture(filePath);
        userService.updateUser(user);
        
        log.info("Profile picture uploaded for user: {}", user.getId());
        
        ApiResponseDTO response = ApiResponseDTO.builder()
                .message("Profile picture uploaded successfully")
                .status(true)
                .build();
        
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/picture")
    public ResponseEntity<ApiResponseDTO> deleteProfilePicture(
            @RequestHeader(JwtConstants.TOKEN_HEADER) String jwt) throws UserException {
        
        User user = userService.findUserByProfile(jwt);
        
        if (user.getProfilePicture() != null && !user.getProfilePicture().isEmpty()) {
            fileStorageService.deleteFile(user.getProfilePicture());
            user.setProfilePicture(null);
            userService.updateUser(user);
        }
        
        ApiResponseDTO response = ApiResponseDTO.builder()
                .message("Profile picture deleted successfully")
                .status(true)
                .build();
        
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}

