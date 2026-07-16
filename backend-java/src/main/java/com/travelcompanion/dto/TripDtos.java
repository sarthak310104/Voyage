package com.travelcompanion.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class TripDtos {

    public record CreateTripRequest(
        @NotBlank String name,
        @NotBlank String destination,
        @NotNull @FutureOrPresent LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotNull BigDecimal budgetTotal,
        String currency
    ) {}

    public record TripResponse(
        String id,
        String name,
        String destination,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal budgetTotal,
        String currency,
        String ownerId,
        String membershipStatus
    ) {}

    public record InviteRequest(@NotBlank String email) {}

    // All fields optional — a null field means "leave this as-is". Bean
    // Validation annotations only fire on non-null values, so @FutureOrPresent
    // here doesn't reject omitted fields, only an explicitly-set past date.
    public record UpdateTripRequest(
        String name,
        String destination,
        @FutureOrPresent LocalDate startDate,
        LocalDate endDate,
        BigDecimal budgetTotal,
        String currency
    ) {}
}