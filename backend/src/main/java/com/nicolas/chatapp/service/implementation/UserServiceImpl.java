package com.nicolas.chatapp.service.implementation;

import com.nicolas.chatapp.config.JwtConstants;
import com.nicolas.chatapp.config.TokenProvider;
import com.nicolas.chatapp.dto.request.UpdateUserRequestDTO;
import com.nicolas.chatapp.exception.UserException;
import com.nicolas.chatapp.model.User;
import com.nicolas.chatapp.repository.UserRepository;
import com.nicolas.chatapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final TokenProvider tokenProvider;

    @Override
    public User findUserById(UUID id) throws UserException {

        Optional<User> user = userRepository.findById(id);

        if (user.isPresent()) {
            return user.get();
        }

        throw new UserException("User not found with id " + id);
    }


    @Override
    public User updateUser(UUID id, UpdateUserRequestDTO request) throws UserException {

        User user = findUserById(id);

        if (Objects.nonNull(request.fullName())) {
            user.setFullName(request.fullName());
        }

        return userRepository.save(user);
    }

    @Override
    public List<User> searchUser(String query) {
        return userRepository.findByFullNameOrEmail(query).stream()
                .sorted(Comparator.comparing(User::getFullName))
                .toList();
    }

    @Override
    public List<User> searchUserByName(String name) {
        return userRepository.findByFullName(name).stream()
                .sorted(Comparator.comparing(User::getFullName))
                .toList();
    }

    @Override
    public User updateUser(User user) throws UserException {
        return userRepository.save(user);
    }

    @Override
    public User findUserByProfile(String jwt) throws UserException {
        String identifier = String.valueOf(tokenProvider.getClaimsFromToken(jwt).get(JwtConstants.EMAIL));
        
        if (identifier == null || identifier.equals("null")) {
            identifier = String.valueOf(tokenProvider.getClaimsFromToken(jwt).get(JwtConstants.PHONE_NUMBER));
        }

        if (identifier == null || identifier.equals("null")) {
            throw new BadCredentialsException("Invalid token");
        }

        Optional<User> user;
        if (identifier.contains("@")) {
            user = userRepository.findByEmail(identifier);
        } else {
            user = userRepository.findByPhoneNumber(identifier);
        }

        if (user.isPresent()) {
            return user.get();
        }

        throw new UserException("User not found");
    }

}
