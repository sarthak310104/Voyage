package com.travelcompanion.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class ExpenseDtos {

    public record CreateExpenseRequest(
        @NotBlank String description,
        @NotNull BigDecimal amount,
        @NotBlank String category,
        @NotBlank String paidBy
    ) {}

    public record ExpenseResponse(
        String id,
        String tripId,
        String description,
        BigDecimal amount,
        String category,
        String paidBy
    ) {}
}
