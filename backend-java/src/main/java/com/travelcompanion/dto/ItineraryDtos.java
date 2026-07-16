package com.travelcompanion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

import java.time.LocalTime;
import java.util.List;

public class ItineraryDtos {

    public record CreateItemRequest(
        @Min(1) int day,
        @NotBlank String title,
        String notes,
        LocalTime startTime,
        String location
    ) {}

    public record ItemResponse(
        String id,
        String tripId,
        int day,
        String title,
        String notes,
        LocalTime startTime,
        String location,
        Double latitude,
        Double longitude,
        int sortOrder
    ) {}

    public record OptimizeDayResult(int day, Double totalDistanceKm, List<ItemResponse> items) {}

    public record OptimizeResponse(List<OptimizeDayResult> days) {}
}