package com.travelcompanion.service;

import com.travelcompanion.dto.ExpenseDtos.*;
import com.travelcompanion.model.Expense;
import com.travelcompanion.model.Trip;
import com.travelcompanion.repository.ExpenseRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    public ExpenseService(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    public List<ExpenseResponse> list(Trip trip) {
        return expenseRepository.findByTrip(trip).stream().map(this::toResponse).toList();
    }

    public ExpenseResponse add(Trip trip, CreateExpenseRequest request) {
        Expense expense = new Expense();
        expense.setTrip(trip);
        expense.setDescription(request.description());
        expense.setAmount(request.amount());
        expense.setCategory(request.category());
        expense.setPaidBy(request.paidBy());
        return toResponse(expenseRepository.save(expense));
    }

    private ExpenseResponse toResponse(Expense expense) {
        return new ExpenseResponse(
            expense.getId().toString(),
            expense.getTrip().getId().toString(),
            expense.getDescription(),
            expense.getAmount(),
            expense.getCategory(),
            expense.getPaidBy()
        );
    }
}
