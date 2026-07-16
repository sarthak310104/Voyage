package com.travelcompanion;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class TravelCompanionApplication {
    public static void main(String[] args) {
        SpringApplication.run(TravelCompanionApplication.class, args);
    }
}
