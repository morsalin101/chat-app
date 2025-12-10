package com.nicolas.chatapp.dto.response;

import com.nicolas.chatapp.model.User;
import lombok.Builder;

import java.util.*;
import java.util.stream.Collectors;

@Builder
public record UserDTO(UUID id, String email, String phoneNumber, String fullName, String bio, 
                      String profilePicture, Boolean isOnline, java.time.LocalDateTime lastSeen, Boolean otpVerified) {

    public static UserDTO fromUser(User user) {
        if (Objects.isNull(user)) return null;
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .fullName(user.getFullName())
                .bio(user.getBio())
                .profilePicture(user.getProfilePicture())
                .isOnline(user.getIsOnline())
                .lastSeen(user.getLastSeen())
                .otpVerified(user.getOtpVerified())
                .build();
    }

    public static Set<UserDTO> fromUsers(Collection<User> users) {
        if (Objects.isNull(users)) return Set.of();
        return users.stream()
                .map(UserDTO::fromUser)
                .collect(Collectors.toSet());
    }

    public static List<UserDTO> fromUsersAsList(Collection<User> users) {
        if (Objects.isNull(users)) return List.of();
        return users.stream()
                .map(UserDTO::fromUser)
                .toList();
    }

}
