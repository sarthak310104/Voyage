package com.travelcompanion.controller;

import com.travelcompanion.dto.CurrencyDtos.ConvertResponse;
import com.travelcompanion.service.CurrencyService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/currency")
public class CurrencyController {

    private final CurrencyService currencyService;

    public CurrencyController(CurrencyService currencyService) {
        this.currencyService = currencyService;
    }

    @GetMapping("/convert")
    public ConvertResponse convert(
        @RequestParam String from,
        @RequestParam String to,
        @RequestParam double amount
    ) {
        return currencyService.convert(from.toUpperCase(), to.toUpperCase(), amount);
    }
}