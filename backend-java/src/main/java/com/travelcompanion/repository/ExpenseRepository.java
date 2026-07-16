package com.travelcompanion.repository;

import com.travelcompanion.model.Expense;
import com.travelcompanion.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    List<Expense> findByTrip(Trip trip);
}
