package com.travelcompanion.service;

import com.travelcompanion.dto.AuthDtos.*;
import com.travelcompanion.model.User;
import com.travelcompanion.repository.UserRepository;
import com.travelcompanion.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        User user = new User(request.email(), request.fullName(), passwordEncoder.encode(request.password()));
        userRepository.save(user);
        String token = jwtUtil.generateToken(user.getId().toString(), user.getEmail());
        return new AuthResponse(token, toResponse(user));
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        String token = jwtUtil.generateToken(user.getId().toString(), user.getEmail());
        return new AuthResponse(token, toResponse(user));
    }

    public UserResponse currentUser(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        return toResponse(user);
    }

    public User requireUser(String userId) {
        return userRepository.findById(UUID.fromString(userId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(user.getId().toString(), user.getEmail(), user.getFullName());
    }
}
