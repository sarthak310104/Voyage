package com.travelcompanion.controller;

import com.travelcompanion.dto.TripDtos.*;
import com.travelcompanion.model.Trip;
import com.travelcompanion.model.User;
import com.travelcompanion.service.AuthService;
import com.travelcompanion.service.TripService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/trips")
public class TripController {

    private final TripService tripService;
    private final AuthService authService;

    public TripController(TripService tripService, AuthService authService) {
        this.tripService = tripService;
        this.authService = authService;
    }

    @GetMapping
    public List<TripResponse> list(Authentication authentication) {
        User user = authService.requireUser(authentication.getName());
        return tripService.listForUser(user);
    }

    @PostMapping
    public ResponseEntity<TripResponse> create(
        Authentication authentication,
        @Valid @RequestBody CreateTripRequest request
    ) {
        User user = authService.requireUser(authentication.getName());
        Trip trip = tripService.create(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(tripService.getForUser(user, trip.getId().toString()));
    }

    @GetMapping("/{tripId}")
    public TripResponse get(Authentication authentication, @PathVariable String tripId) {
        User user = authService.requireUser(authentication.getName());
        return tripService.getForUser(user, tripId);
    }

    @PutMapping("/{tripId}")
    public TripResponse update(
        Authentication authentication,
        @PathVariable String tripId,
        @Valid @RequestBody UpdateTripRequest request
    ) {
        User user = authService.requireUser(authentication.getName());
        return tripService.update(user, tripId, request);
    }

    @DeleteMapping("/{tripId}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable String tripId) {
        User user = authService.requireUser(authentication.getName());
        tripService.delete(user, tripId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{tripId}/invite")
    public ResponseEntity<Void> invite(
        Authentication authentication,
        @PathVariable String tripId,
        @Valid @RequestBody InviteRequest request
    ) {
        User user = authService.requireUser(authentication.getName());
        tripService.invite(user, tripId, request.email());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{tripId}/invite/accept")
    public TripResponse acceptInvite(Authentication authentication, @PathVariable String tripId) {
        User user = authService.requireUser(authentication.getName());
        return tripService.acceptInvite(user, tripId);
    }

    @PostMapping("/{tripId}/invite/decline")
    public ResponseEntity<Void> declineInvite(Authentication authentication, @PathVariable String tripId) {
        User user = authService.requireUser(authentication.getName());
        tripService.declineInvite(user, tripId);
        return ResponseEntity.noContent().build();
    }
}