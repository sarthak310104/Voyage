package com.travelcompanion.controller;

import com.travelcompanion.dto.ExpenseDtos.*;
import com.travelcompanion.model.Trip;
import com.travelcompanion.model.User;
import com.travelcompanion.service.AuthService;
import com.travelcompanion.service.ExpenseService;
import com.travelcompanion.service.TripService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/trips/{tripId}/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;
    private final TripService tripService;
    private final AuthService authService;

    public ExpenseController(ExpenseService expenseService, TripService tripService, AuthService authService) {
        this.expenseService = expenseService;
        this.tripService = tripService;
        this.authService = authService;
    }

    @GetMapping
    public List<ExpenseResponse> list(Authentication authentication, @PathVariable String tripId) {
        Trip trip = accessibleTrip(authentication, tripId);
        return expenseService.list(trip);
    }

    @PostMapping
    public ResponseEntity<ExpenseResponse> add(
        Authentication authentication,
        @PathVariable String tripId,
        @Valid @RequestBody CreateExpenseRequest request
    ) {
        Trip trip = accessibleTrip(authentication, tripId);
        return ResponseEntity.status(HttpStatus.CREATED).body(expenseService.add(trip, request));
    }

    private Trip accessibleTrip(Authentication authentication, String tripId) {
        User user = authService.requireUser(authentication.getName());
        Trip trip = tripService.getEntity(tripId);
        tripService.assertAccess(user, trip);
        return trip;
    }
}
