package com.travelcompanion.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "trip_members")
@Getter
@Setter
@NoArgsConstructor
public class TripMember {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String role = "collaborator";

    // "pending" until the invited user explicitly accepts — assertAccess()
    // only grants real access once this is "accepted"; the owner always has
    // access regardless of this field.
    @Column(nullable = false)
    private String status = "pending";

    public TripMember(Trip trip, String email) {
        this.trip = trip;
        this.email = email;
    }
}