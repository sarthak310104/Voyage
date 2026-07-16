package com.travelcompanion.repository;

import com.travelcompanion.model.ItineraryItem;
import com.travelcompanion.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ItineraryItemRepository extends JpaRepository<ItineraryItem, UUID> {
    List<ItineraryItem> findByTripOrderByDayAscSortOrderAsc(Trip trip);
}
