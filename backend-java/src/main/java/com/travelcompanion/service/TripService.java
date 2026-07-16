package com.travelcompanion.service;

import com.travelcompanion.dto.TripDtos.*;
import com.travelcompanion.model.Trip;
import com.travelcompanion.model.TripMember;
import com.travelcompanion.model.User;
import com.travelcompanion.repository.ExpenseRepository;
import com.travelcompanion.repository.ItineraryItemRepository;
import com.travelcompanion.repository.TripMemberRepository;
import com.travelcompanion.repository.TripRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class TripService {

    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final ItineraryItemRepository itineraryItemRepository;
    private final ExpenseRepository expenseRepository;

    public TripService(
        TripRepository tripRepository,
        TripMemberRepository tripMemberRepository,
        ItineraryItemRepository itineraryItemRepository,
        ExpenseRepository expenseRepository
    ) {
        this.tripRepository = tripRepository;
        this.tripMemberRepository = tripMemberRepository;
        this.itineraryItemRepository = itineraryItemRepository;
        this.expenseRepository = expenseRepository;
    }

    // Includes owned trips, accepted collaborations, AND pending invites —
    // the frontend needs pending ones to show an Accept/Decline card.
    public List<TripResponse> listForUser(User user) {
        List<Trip> owned = tripRepository.findByOwner(user);
        List<Trip> memberOf = tripMemberRepository.findByEmail(user.getEmail())
            .stream().map(TripMember::getTrip).toList();

        java.util.LinkedHashMap<UUID, Trip> byId = new java.util.LinkedHashMap<>();
        Stream.concat(owned.stream(), memberOf.stream()).forEach(t -> byId.put(t.getId(), t));

        return byId.values().stream()
            .map(t -> toResponse(t, membershipStatusFor(user, t)))
            .collect(Collectors.toList());
    }

    // NOTE: deliberately not cached. Caching a raw JPA entity (e.g. via
    // @Cacheable) in Redis breaks its lazy-loaded associations on every
    // cache hit — the deserialized copy isn't attached to a Hibernate
    // session, so accessing trip.getOwner() later (as assertAccess does)
    // throws. Always fetch fresh from the repository here.
    public Trip getEntity(String tripId) {
        return tripRepository.findById(UUID.fromString(tripId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));
    }

    // Requires accepted access — a pending invitee can't open the full trip
    // page (assertAccess enforces this); they only see it as a card on the
    // dashboard with Accept/Decline.
    public TripResponse getForUser(User user, String tripId) {
        Trip trip = getEntity(tripId);
        assertAccess(user, trip);
        return toResponse(trip, membershipStatusFor(user, trip));
    }

    public Trip create(User owner, CreateTripRequest request) {
        Trip trip = new Trip();
        trip.setName(request.name());
        trip.setDestination(request.destination());
        trip.setStartDate(request.startDate());
        trip.setEndDate(request.endDate());
        trip.setBudgetTotal(request.budgetTotal());
        trip.setCurrency(request.currency() == null || request.currency().isBlank() ? "USD" : request.currency());
        trip.setOwner(owner);
        return tripRepository.save(trip);
    }

    public void invite(User requester, String tripId, String email) {
        Trip trip = getEntity(tripId);
        assertAccess(requester, trip);
        boolean alreadyMember = tripMemberRepository.findByTrip(trip).stream()
            .anyMatch(m -> m.getEmail().equalsIgnoreCase(email));
        if (!alreadyMember) {
            tripMemberRepository.save(new TripMember(trip, email)); // status defaults to "pending"
        }
    }

    public TripResponse acceptInvite(User user, String tripId) {
        Trip trip = getEntity(tripId);
        TripMember membership = findMembership(user, trip);
        membership.setStatus("accepted");
        tripMemberRepository.save(membership);
        return toResponse(trip, "accepted");
    }

    public void declineInvite(User user, String tripId) {
        Trip trip = getEntity(tripId);
        TripMember membership = findMembership(user, trip);
        tripMemberRepository.delete(membership);
    }

    private TripMember findMembership(User user, Trip trip) {
        return tripMemberRepository.findByTrip(trip).stream()
            .filter(m -> m.getEmail().equalsIgnoreCase(user.getEmail()))
            .findFirst()
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No invite found for you on this trip"));
    }

    // Editing/deleting are owner-only — collaborators can view and
    // contribute to itinerary/budget/packing, but shouldn't be able to
    // change the trip's core details or remove it outright.
    public TripResponse update(User user, String tripId, UpdateTripRequest request) {
        Trip trip = getEntity(tripId);
        assertOwner(user, trip);

        if (request.name() != null && !request.name().isBlank()) trip.setName(request.name());
        if (request.destination() != null && !request.destination().isBlank()) trip.setDestination(request.destination());
        if (request.startDate() != null) trip.setStartDate(request.startDate());
        if (request.endDate() != null) trip.setEndDate(request.endDate());
        if (request.budgetTotal() != null) trip.setBudgetTotal(request.budgetTotal());
        if (request.currency() != null && !request.currency().isBlank()) trip.setCurrency(request.currency());

        return toResponse(tripRepository.save(trip), "owner");
    }

    public void delete(User user, String tripId) {
        Trip trip = getEntity(tripId);
        assertOwner(user, trip);

        // ItineraryItem/Expense only hold a @ManyToOne back to Trip (no
        // @OneToMany cascade configured on Trip's side for them), so they
        // won't be cleaned up automatically — delete them explicitly first
        // or the FK constraint blocks removing the trip.
        itineraryItemRepository.deleteAll(itineraryItemRepository.findByTripOrderByDayAscSortOrderAsc(trip));
        expenseRepository.deleteAll(expenseRepository.findByTrip(trip));
        tripRepository.delete(trip); // TripMember rows cascade via Trip's own @OneToMany mapping
    }

    private void assertOwner(User user, Trip trip) {
        if (!trip.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the trip owner can do this");
        }
    }

    // Only the owner or an ACCEPTED collaborator get real access — a
    // pending invite is not access yet.
    public void assertAccess(User user, Trip trip) {
        boolean isOwner = trip.getOwner().getId().equals(user.getId());
        boolean isAcceptedMember = tripMemberRepository.findByTrip(trip).stream()
            .anyMatch(m -> m.getEmail().equalsIgnoreCase(user.getEmail()) && "accepted".equals(m.getStatus()));
        if (!isOwner && !isAcceptedMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You don't have access to this trip");
        }
    }

    private String membershipStatusFor(User user, Trip trip) {
        if (trip.getOwner().getId().equals(user.getId())) {
            return "owner";
        }
        Optional<TripMember> membership = tripMemberRepository.findByTrip(trip).stream()
            .filter(m -> m.getEmail().equalsIgnoreCase(user.getEmail()))
            .findFirst();
        return membership.map(TripMember::getStatus).orElse("pending");
    }

    private TripResponse toResponse(Trip trip, String membershipStatus) {
        return new TripResponse(
            trip.getId().toString(),
            trip.getName(),
            trip.getDestination(),
            trip.getStartDate(),
            trip.getEndDate(),
            trip.getBudgetTotal(),
            trip.getCurrency(),
            trip.getOwner().getId().toString(),
            membershipStatus
        );
    }
}