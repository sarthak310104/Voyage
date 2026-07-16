import logging

from fastapi import APIRouter

from app.models.schemas import PackingSuggestRequest, PackingSuggestResponse
from app.services import llm

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/packing", tags=["packing"])

_BASE_ITEMS = ["Passport / ID", "Phone charger", "Toiletries bag", "Reusable water bottle"]
_SEASON_ITEMS = {
    "summer": ["Sunscreen", "Sunglasses", "Light breathable clothing", "Sandals"],
    "winter": ["Warm coat", "Gloves", "Thermal layers", "Waterproof boots"],
    "spring": ["Light rain jacket", "Layered clothing", "Umbrella"],
    "fall": ["Light sweater", "Rain jacket", "Comfortable walking shoes"],
}


def _mock_packing(req: PackingSuggestRequest) -> list[str]:
    season_items = _SEASON_ITEMS.get(req.season.lower(), _SEASON_ITEMS["summer"])
    extra = ["Extra clothing for longer stay"] if req.days > 7 else []
    return _BASE_ITEMS + season_items + extra


@router.post("/suggest", response_model=PackingSuggestResponse)
async def suggest_packing(req: PackingSuggestRequest):
    prompt = (
        f"Suggest a packing list for a {req.days}-day trip to {req.destination} "
        f"during {req.season}. Respond ONLY with a JSON array of short item strings, "
        "10-16 items, specific to the destination and season."
    )
    raw = await llm.generate_text(prompt, system="You are a practical travel packing expert.")

    if raw is None:
        logger.info("Packing suggestions: no live provider response, using mock")
        return PackingSuggestResponse(items=_mock_packing(req))

    parsed = llm.extract_json(raw)

    if isinstance(parsed, dict):
        for value in parsed.values():
            if isinstance(value, list):
                parsed = value
                break

    if not parsed or not isinstance(parsed, list) or not all(isinstance(i, str) for i in parsed):
        logger.warning("Packing suggestions: response wasn't a JSON array of strings, using mock. Raw: %r", raw[:500])
        return PackingSuggestResponse(items=_mock_packing(req))

    return PackingSuggestResponse(items=parsed)