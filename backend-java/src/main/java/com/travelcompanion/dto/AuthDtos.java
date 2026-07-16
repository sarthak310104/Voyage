package com.travelcompanion.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record RegisterRequest(
        @Email @NotBlank String email,
        @Size(min = 8) @NotBlank String password,
        @NotBlank String fullName
    ) {}

    public record LoginRequest(
        @Email @NotBlank String email,
        @NotBlank String password
    ) {}

    public record UserResponse(String id, String email, String fullName) {}

    public record AuthResponse(String token, UserResponse user) {}
}
