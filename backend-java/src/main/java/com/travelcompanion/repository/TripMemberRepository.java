package com.travelcompanion.repository;

import com.travelcompanion.model.Trip;
import com.travelcompanion.model.TripMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TripMemberRepository extends JpaRepository<TripMember, UUID> {
    List<TripMember> findByTrip(Trip trip);
    List<TripMember> findByEmail(String email);
}
