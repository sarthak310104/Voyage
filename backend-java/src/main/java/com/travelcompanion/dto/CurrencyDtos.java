package com.travelcompanion.dto;

public class CurrencyDtos {
    public record ConvertResponse(
        String from,
        String to,
        double amount,
        double rate,
        double convertedAmount,
        String date
    ) {}
}