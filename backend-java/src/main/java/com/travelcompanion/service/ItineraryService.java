package com.travelcompanion.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelcompanion.dto.ItineraryDtos.*;
import com.travelcompanion.model.ItineraryItem;
import com.travelcompanion.model.Trip;
import com.travelcompanion.repository.ItineraryItemRepository;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ItineraryService {

    private final ItineraryItemRepository itineraryItemRepository;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(6)).build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ItineraryService(ItineraryItemRepository itineraryItemRepository) {
        this.itineraryItemRepository = itineraryItemRepository;
    }

    public List<ItemResponse> list(Trip trip) {
        return itineraryItemRepository.findByTripOrderByDayAscSortOrderAsc(trip)
            .stream().map(this::toResponse).toList();
    }

    public ItemResponse add(Trip trip, CreateItemRequest request) {
        ItineraryItem item = new ItineraryItem();
        item.setTrip(trip);
        item.setDay(request.day());
        item.setTitle(request.title());
        item.setNotes(request.notes());
        item.setStartTime(request.startTime());
        item.setLocation(request.location());

        if (request.location() != null && !request.location().isBlank()) {
            double[] coords = geocode(request.location() + ", " + trip.getDestination());
            if (coords == null) {
                coords = geocode(request.location());
            }
            if (coords != null) {
                item.setLatitude(coords[0]);
                item.setLongitude(coords[1]);
            }
        }

        int nextOrder = itineraryItemRepository.findByTripOrderByDayAscSortOrderAsc(trip).stream()
            .filter(i -> i.getDay() == request.day())
            .mapToInt(ItineraryItem::getSortOrder)
            .max().orElse(-1) + 1;
        item.setSortOrder(nextOrder);

        return toResponse(itineraryItemRepository.save(item));
    }

    public void delete(Trip trip, String itemId) {
        ItineraryItem item = itineraryItemRepository.findById(UUID.fromString(itemId))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Itinerary item not found"));
        if (!item.getTrip().getId().equals(trip.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Item does not belong to this trip");
        }
        itineraryItemRepository.delete(item);
    }
    
    /** Removes every itinerary item for this trip — used before a fresh
     * AI-generate so it replaces the itinerary instead of stacking a new
     * batch on top of whatever was already there. */
    public void clearAll(Trip trip) {
        itineraryItemRepository.deleteAll(itineraryItemRepository.findByTripOrderByDayAscSortOrderAsc(trip));
    }

    /**
     * Reorders each day's items by nearest-neighbor distance starting from
     * whichever item currently sorts first that day (or has the earliest
     * start time, if set). Items without geocoded coordinates are left in
     * their current relative order, appended after the routed ones.
     */
    public OptimizeResponse optimize(Trip trip) {
        List<ItineraryItem> all = itineraryItemRepository.findByTripOrderByDayAscSortOrderAsc(trip);
        Map<Integer, List<ItineraryItem>> byDay = new TreeMap<>();
        for (ItineraryItem item : all) {
            byDay.computeIfAbsent(item.getDay(), d -> new ArrayList<>()).add(item);
        }

        List<OptimizeDayResult> results = new ArrayList<>();
        for (Map.Entry<Integer, List<ItineraryItem>> entry : byDay.entrySet()) {
            List<ItineraryItem> dayItems = entry.getValue();
            List<ItineraryItem> ordered = nearestNeighborOrder(dayItems);

            for (int i = 0; i < ordered.size(); i++) {
                ordered.get(i).setSortOrder(i);
            }
            itineraryItemRepository.saveAll(ordered);

            double totalKm = totalRouteDistance(ordered);
            results.add(new OptimizeDayResult(
                entry.getKey(),
                ordered.stream().anyMatch(i -> i.getLatitude() != null) ? totalKm : null,
                ordered.stream().map(this::toResponse).toList()
            ));
        }

        return new OptimizeResponse(results);
    }

    private List<ItineraryItem> nearestNeighborOrder(List<ItineraryItem> items) {
        List<ItineraryItem> withCoords = items.stream()
            .filter(i -> i.getLatitude() != null && i.getLongitude() != null)
            .sorted(Comparator.comparing(
                ItineraryItem::getStartTime, Comparator.nullsLast(Comparator.naturalOrder())
            ).thenComparing(ItineraryItem::getSortOrder))
            .collect(Collectors.toCollection(ArrayList::new));
        List<ItineraryItem> withoutCoords = items.stream()
            .filter(i -> i.getLatitude() == null || i.getLongitude() == null)
            .toList();

        if (withCoords.size() <= 1) {
            List<ItineraryItem> result = new ArrayList<>(withCoords);
            result.addAll(withoutCoords);
            return result;
        }

        List<ItineraryItem> remaining = new ArrayList<>(withCoords);
        List<ItineraryItem> ordered = new ArrayList<>();
        ItineraryItem current = remaining.remove(0);
        ordered.add(current);

        while (!remaining.isEmpty()) {
            ItineraryItem nearest = null;
            double bestDist = Double.MAX_VALUE;
            for (ItineraryItem candidate : remaining) {
                double d = haversineKm(current.getLatitude(), current.getLongitude(), candidate.getLatitude(), candidate.getLongitude());
                if (d < bestDist) {
                    bestDist = d;
                    nearest = candidate;
                }
            }
            ordered.add(nearest);
            remaining.remove(nearest);
            current = nearest;
        }

        ordered.addAll(withoutCoords);
        return ordered;
    }

    private double totalRouteDistance(List<ItineraryItem> ordered) {
        double total = 0;
        ItineraryItem previous = null;
        for (ItineraryItem item : ordered) {
            if (item.getLatitude() == null || item.getLongitude() == null) continue;
            if (previous != null) {
                total += haversineKm(previous.getLatitude(), previous.getLongitude(), item.getLatitude(), item.getLongitude());
            }
            previous = item;
        }
        return total;
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double r = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return r * c;
    }

    /** Best-effort geocoding via Open-Meteo's free, keyless geocoding API. Returns null on any failure. */
    private double[] geocode(String query) {
        try {
            String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
            URI uri = URI.create("https://geocoding-api.open-meteo.com/v1/search?count=1&name=" + encoded);
            HttpRequest request = HttpRequest.newBuilder(uri).GET().timeout(Duration.ofSeconds(6)).build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode results = root.path("results");
            if (!results.isArray() || results.isEmpty()) return null;
            JsonNode first = results.get(0);
            return new double[] { first.get("latitude").asDouble(), first.get("longitude").asDouble() };
        } catch (Exception e) {
            return null;
        }
    }

    private ItemResponse toResponse(ItineraryItem item) {
        return new ItemResponse(
            item.getId().toString(),
            item.getTrip().getId().toString(),
            item.getDay(),
            item.getTitle(),
            item.getNotes(),
            item.getStartTime(),
            item.getLocation(),
            item.getLatitude(),
            item.getLongitude(),
            item.getSortOrder()
        );
    }
}