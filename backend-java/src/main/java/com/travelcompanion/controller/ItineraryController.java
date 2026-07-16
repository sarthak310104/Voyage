package com.travelcompanion.controller;

import com.travelcompanion.dto.ItineraryDtos.*;
import com.travelcompanion.model.Trip;
import com.travelcompanion.model.User;
import com.travelcompanion.service.AuthService;
import com.travelcompanion.service.ItineraryService;
import com.travelcompanion.service.TripService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/trips/{tripId}/itinerary")
public class ItineraryController {

    private final ItineraryService itineraryService;
    private final TripService tripService;
    private final AuthService authService;

    public ItineraryController(ItineraryService itineraryService, TripService tripService, AuthService authService) {
        this.itineraryService = itineraryService;
        this.tripService = tripService;
        this.authService = authService;
    }

    @GetMapping
    public List<ItemResponse> list(Authentication authentication, @PathVariable String tripId) {
        Trip trip = accessibleTrip(authentication, tripId);
        return itineraryService.list(trip);
    }

    @PostMapping
    public ResponseEntity<ItemResponse> add(
        Authentication authentication,
        @PathVariable String tripId,
        @Valid @RequestBody CreateItemRequest request
    ) {
        Trip trip = accessibleTrip(authentication, tripId);
        return ResponseEntity.status(HttpStatus.CREATED).body(itineraryService.add(trip, request));
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> delete(
        Authentication authentication,
        @PathVariable String tripId,
        @PathVariable String itemId
    ) {
        Trip trip = accessibleTrip(authentication, tripId);
        itineraryService.delete(trip, itemId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/optimize")
    public OptimizeResponse optimize(Authentication authentication, @PathVariable String tripId) {
        Trip trip = accessibleTrip(authentication, tripId);
        return itineraryService.optimize(trip);
    }

    private Trip accessibleTrip(Authentication authentication, String tripId) {
        User user = authService.requireUser(authentication.getName());
        Trip trip = tripService.getEntity(tripId);
        tripService.assertAccess(user, trip);
        return trip;
    }
}