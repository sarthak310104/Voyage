package com.travelcompanion.controller;

import com.travelcompanion.dto.WeatherDtos.WeatherResponse;
import com.travelcompanion.model.Trip;
import com.travelcompanion.model.User;
import com.travelcompanion.service.AuthService;
import com.travelcompanion.service.TripService;
import com.travelcompanion.service.WeatherService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/trips/{tripId}/weather")
public class WeatherController {

    private final WeatherService weatherService;
    private final TripService tripService;
    private final AuthService authService;

    public WeatherController(WeatherService weatherService, TripService tripService, AuthService authService) {
        this.weatherService = weatherService;
        this.tripService = tripService;
        this.authService = authService;
    }

    @GetMapping
    public WeatherResponse current(Authentication authentication, @PathVariable String tripId) {
        User user = authService.requireUser(authentication.getName());
        Trip trip = tripService.getEntity(tripId);
        tripService.assertAccess(user, trip);
        return weatherService.getWeatherForTrip(trip.getDestination(), trip.getStartDate(), trip.getEndDate());
    }
}
