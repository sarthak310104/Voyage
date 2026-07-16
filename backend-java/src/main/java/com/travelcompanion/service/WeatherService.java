package com.travelcompanion.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelcompanion.dto.WeatherDtos.WeatherResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Weather for a destination, aware of *when* the trip actually is — never
 * silently mislabels a forecast or a historical guess as "current
 * conditions". Uses Open-Meteo (free, no API key) throughout:
 *
 * - Trip is happening today (or "today" falls within its date range):
 *   real current conditions ("current").
 * - Trip starts within the next 16 days (Open-Meteo's forecast horizon):
 *   a real forecast for the trip's start date ("forecast").
 * - Trip is further out, or already fully in the past: no live/forecast
 *   data exists for that date, so we average the same calendar window from
 *   last year as a "typical" estimate, clearly labeled as such ("typical").
 */
@Service
public class WeatherService {

    private static final HttpClient CLIENT = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(5))
        .build();

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final int FORECAST_HORIZON_DAYS = 15;

    // WMO weather codes -> short human-readable description
    private static final Map<Integer, String> CONDITIONS = Map.ofEntries(
        Map.entry(0, "Clear sky"),
        Map.entry(1, "Mainly clear"),
        Map.entry(2, "Partly cloudy"),
        Map.entry(3, "Overcast"),
        Map.entry(45, "Fog"),
        Map.entry(48, "Depositing rime fog"),
        Map.entry(51, "Light drizzle"),
        Map.entry(53, "Moderate drizzle"),
        Map.entry(55, "Dense drizzle"),
        Map.entry(61, "Slight rain"),
        Map.entry(63, "Moderate rain"),
        Map.entry(65, "Heavy rain"),
        Map.entry(71, "Slight snow"),
        Map.entry(73, "Moderate snow"),
        Map.entry(75, "Heavy snow"),
        Map.entry(80, "Rain showers"),
        Map.entry(81, "Moderate rain showers"),
        Map.entry(82, "Violent rain showers"),
        Map.entry(95, "Thunderstorm"),
        Map.entry(96, "Thunderstorm with hail"),
        Map.entry(99, "Thunderstorm with heavy hail")
    );

    public WeatherResponse getWeatherForTrip(String destination, LocalDate startDate, LocalDate endDate) {
        double[] coords = geocode(destination);
        double lat = coords[0];
        double lon = coords[1];
        LocalDate today = LocalDate.now();

        boolean tripIsToday = !today.isBefore(startDate) && !today.isAfter(endDate);
        boolean tripStartsWithinForecastRange = !startDate.isBefore(today)
            && !startDate.isAfter(today.plusDays(FORECAST_HORIZON_DAYS));

        if (tripIsToday) {
            return fetchCurrent(destination, lat, lon);
        }
        if (tripStartsWithinForecastRange) {
            return fetchForecast(destination, lat, lon, startDate);
        }
        return fetchTypical(destination, lat, lon, startDate, endDate);
    }

    private double[] geocode(String destination) {
        String encoded = URLEncoder.encode(destination, StandardCharsets.UTF_8);
        String url = "https://geocoding-api.open-meteo.com/v1/search?name=" + encoded + "&count=1";
        JsonNode root = get(url);
        JsonNode results = root.get("results");
        if (results == null || !results.isArray() || results.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Could not find coordinates for \"" + destination + "\"");
        }
        JsonNode first = results.get(0);
        return new double[]{first.get("latitude").asDouble(), first.get("longitude").asDouble()};
    }

    private WeatherResponse fetchCurrent(String destination, double lat, double lon) {
        String url = String.format(
            "https://api.open-meteo.com/v1/forecast?latitude=%f&longitude=%f&current=temperature_2m,wind_speed_10m,weather_code",
            lat, lon
        );
        JsonNode root = get(url);
        JsonNode current = root.get("current");
        if (current == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Weather provider returned no current conditions");
        }
        int code = current.path("weather_code").asInt(-1);
        return new WeatherResponse(
            destination, lat, lon,
            current.path("temperature_2m").asDouble(),
            current.path("wind_speed_10m").asDouble(),
            CONDITIONS.getOrDefault(code, "Unknown"),
            current.path("time").asText(""),
            "current",
            "Current conditions"
        );
    }

    private WeatherResponse fetchForecast(String destination, double lat, double lon, LocalDate date) {
        String iso = date.format(DateTimeFormatter.ISO_LOCAL_DATE);
        String url = String.format(
            "https://api.open-meteo.com/v1/forecast?latitude=%f&longitude=%f"
                + "&daily=temperature_2m_max,temperature_2m_min,weather_code,wind_speed_10m_max"
                + "&timezone=auto&start_date=%s&end_date=%s",
            lat, lon, iso, iso
        );
        JsonNode root = get(url);
        JsonNode daily = root.get("daily");
        if (daily == null || !daily.has("temperature_2m_max") || daily.get("temperature_2m_max").isEmpty()) {
            // fell outside the provider's actual coverage even though we
            // expected it to be in range — fall back to a typical estimate
            return fetchTypical(destination, lat, lon, date, date);
        }
        double max = daily.get("temperature_2m_max").get(0).asDouble();
        double min = daily.get("temperature_2m_min").get(0).asDouble();
        int code = daily.get("weather_code").get(0).asInt(-1);
        double wind = daily.get("wind_speed_10m_max").get(0).asDouble();

        return new WeatherResponse(
            destination, lat, lon,
            (max + min) / 2.0,
            wind,
            CONDITIONS.getOrDefault(code, "Unknown"),
            iso,
            "forecast",
            "Forecast for " + friendlyDate(date)
        );
    }

    /**
     * No live forecast exists this far out (or the trip already happened),
     * so we average the same ~5-day calendar window from one year ago as a
     * "what's typical around this time" estimate. Clearly labeled as such —
     * this is a seasonal guess, not a prediction for the actual trip dates.
     */
    private WeatherResponse fetchTypical(String destination, double lat, double lon, LocalDate startDate, LocalDate endDate) {
        LocalDate refStart = startDate.minusYears(1).minusDays(2);
        LocalDate refEnd = startDate.minusYears(1).plusDays(2);
        String startIso = refStart.format(DateTimeFormatter.ISO_LOCAL_DATE);
        String endIso = refEnd.format(DateTimeFormatter.ISO_LOCAL_DATE);

        String url = String.format(
            "https://archive-api.open-meteo.com/v1/archive?latitude=%f&longitude=%f"
                + "&daily=temperature_2m_max,temperature_2m_min,weather_code,wind_speed_10m_max"
                + "&timezone=auto&start_date=%s&end_date=%s",
            lat, lon, startIso, endIso
        );
        JsonNode root = get(url);
        JsonNode daily = root.get("daily");
        if (daily == null || !daily.has("temperature_2m_max") || daily.get("temperature_2m_max").isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Weather provider had no historical data for this date range");
        }

        List<Double> maxes = toDoubleList(daily.get("temperature_2m_max"));
        List<Double> mins = toDoubleList(daily.get("temperature_2m_min"));
        List<Double> winds = toDoubleList(daily.get("wind_speed_10m_max"));
        int midIndex = maxes.size() / 2;
        int code = daily.get("weather_code").get(midIndex).asInt(-1);

        double avgMax = average(maxes);
        double avgMin = average(mins);
        double avgWind = average(winds);

        return new WeatherResponse(
            destination, lat, lon,
            (avgMax + avgMin) / 2.0,
            avgWind,
            CONDITIONS.getOrDefault(code, "Unknown"),
            startIso + " to " + endIso + " (last year)",
            "typical",
            "Typical for " + friendlyMonth(startDate) + " (based on last year)"
        );
    }

    private List<Double> toDoubleList(JsonNode array) {
        List<Double> values = new ArrayList<>();
        for (JsonNode n : array) values.add(n.asDouble());
        return values;
    }

    private double average(List<Double> values) {
        return values.stream().mapToDouble(Double::doubleValue).average().orElse(0);
    }

    private String friendlyDate(LocalDate date) {
        return date.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + date.getDayOfMonth();
    }

    private String friendlyMonth(LocalDate date) {
        String monthName = date.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH);
        int day = date.getDayOfMonth();
        String part = day <= 10 ? "early" : day <= 20 ? "mid" : "late";
        return part + " " + monthName;
    }

    private JsonNode get(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(8))
                .GET()
                .build();
            HttpResponse<String> response = CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Weather provider request failed");
            }
            return MAPPER.readTree(response.body());
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not reach weather provider: " + e.getMessage());
        }
    }
}