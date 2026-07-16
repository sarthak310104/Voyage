import logging

from fastapi import APIRouter

from app.models.schemas import ItineraryGenerateRequest, ItineraryGenerateResponse, ItineraryDay
from app.services import llm

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/itinerary", tags=["itinerary"])


def _mock_itinerary(req: ItineraryGenerateRequest) -> list[ItineraryDay]:
    interests = ", ".join(req.interests) if req.interests else "sightseeing"
    return [
        ItineraryDay(
            day=day,
            title=f"Day {day} in {req.destination}",
            notes=(
                f"[Mock — set OPENAI_API_KEY or GEMINI_API_KEY for real AI suggestions] "
                f"Explore {req.destination} with a focus on {interests}. "
                f"Morning: local landmark; afternoon: {interests.split(',')[0].strip()}; evening: dinner nearby."
            ),
            location=req.destination,
        )
        for day in range(1, req.days + 1)
    ]


@router.post("/generate", response_model=ItineraryGenerateResponse)
async def generate_itinerary(req: ItineraryGenerateRequest):
    prompt = (
        f"Create a {req.days}-day travel itinerary for {req.destination}. "
        f"Traveler interests: {', '.join(req.interests) or 'general sightseeing'}. "
        "Respond ONLY with a JSON array, one object per day, each with keys "
        '"day" (integer), "title" (short string), "notes" (2-3 sentences, '
        "specific to the destination, mentioning realistic activity types for the time of day), "
        'and "location" (the single most specific real, geocodable place name for that day\'s '
        'main activity — e.g. "Eiffel Tower, Paris" or "Shibuya, Tokyo" — not a vague area).'
    )
    raw = await llm.generate_text(prompt, system="You are an expert local travel planner.")

    if raw is None:
        logger.info("Itinerary generation: no live provider response, using mock")
        return ItineraryGenerateResponse(itinerary=_mock_itinerary(req))

    parsed = llm.extract_json(raw)

    # Gemini/OpenAI sometimes wrap the array in a named key (e.g.
    # {"itinerary": [...]}) despite being told to respond with a bare
    # array — unwrap the first list value we find before giving up.
    if isinstance(parsed, dict):
        for value in parsed.values():
            if isinstance(value, list):
                parsed = value
                break

    if not parsed or not isinstance(parsed, list):
        logger.warning("Itinerary generation: response wasn't a JSON array, using mock. Raw: %r", raw[:500])
        return ItineraryGenerateResponse(itinerary=_mock_itinerary(req))

    try:
        days = [
            ItineraryDay(
                day=int(d["day"]),
                title=str(d["title"]),
                notes=str(d["notes"]),
                location=str(d.get("location") or req.destination),
            )
            for d in parsed
        ]
        if not days:
            raise ValueError("empty itinerary")
        return ItineraryGenerateResponse(itinerary=days)
    except (KeyError, ValueError, TypeError) as e:
        logger.warning("Itinerary generation: couldn't map parsed JSON to ItineraryDay (%s), using mock. Parsed: %r", e, parsed)
        return ItineraryGenerateResponse(itinerary=_mock_itinerary(req))