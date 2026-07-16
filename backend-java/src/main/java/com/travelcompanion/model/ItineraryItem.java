package com.travelcompanion.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "itinerary_items")
@Getter
@Setter
@NoArgsConstructor
public class ItineraryItem {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @Column(nullable = false)
    private int day;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "start_time")
    private LocalTime startTime;

    private String location;

    // Best-effort geocoded from `location` when the item is created — null
    // if geocoding failed or no location was given. Used for route
    // optimization and the map view.
    private Double latitude;
    private Double longitude;

    // Position within its day; route optimization rewrites this. Plain
    // insertion order until then.
    @Column(name = "sort_order")
    private int sortOrder = 0;
}