package com.travelcompanion.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelcompanion.dto.CurrencyDtos.ConvertResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class CurrencyService {

    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(8))
        .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Frankfurter (frankfurter.dev) is a free, keyless exchange rate API
     * backed by European Central Bank reference rates, updated on ECB
     * business days. No API key or account needed.
     */
    public ConvertResponse convert(String from, String to, double amount) {
        if (from.equalsIgnoreCase(to)) {
            return new ConvertResponse(from, to, amount, 1.0, amount, "same-currency");
        }
        try {
            URI uri = URI.create(
                "https://api.frankfurter.dev/v1/latest?amount=" + amount + "&from=" + from + "&to=" + to
            );
            HttpRequest request = HttpRequest.newBuilder(uri).GET().timeout(Duration.ofSeconds(8)).build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode rates = root.path("rates");
            if (rates.isMissingNode() || !rates.has(to)) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Exchange rate provider did not return a rate for " + to
                );
            }
            double convertedAmount = rates.get(to).asDouble();
            double rate = amount == 0 ? 0 : convertedAmount / amount;
            String date = root.path("date").asText(null);
            return new ConvertResponse(from, to, amount, rate, convertedAmount, date);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not reach the exchange rate provider");
        }
    }
}