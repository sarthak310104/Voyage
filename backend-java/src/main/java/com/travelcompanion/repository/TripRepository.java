package com.travelcompanion.repository;

import com.travelcompanion.model.Trip;
import com.travelcompanion.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TripRepository extends JpaRepository<Trip, UUID> {
    List<Trip> findByOwner(User owner);
}
