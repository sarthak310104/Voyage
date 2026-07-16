package com.travelcompanion.dto;

public class WeatherDtos {

    public record WeatherResponse(
        String destination,
        double latitude,
        double longitude,
        double temperatureC,
        double windSpeedKmh,
        String condition,
        String observedAt,
        // Distinguishes what kind of data this actually is, so the UI never
        // implies "right now" when it's really a forecast or a historical
        // average — see WeatherService for when each applies.
        String kind,   // "current" | "forecast" | "typical"
        String label   // human-readable, e.g. "Forecast for Jul 20" or "Typical for late July (based on last year)"
    ) {}
}