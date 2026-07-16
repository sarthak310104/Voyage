import logging

from fastapi import APIRouter

from app.models.schemas import RecommendationsRequest, RecommendationsResponse, Recommendation
from app.services import llm

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/recommendations", tags=["recommendations"])

_MOCK_POOL = [
    ("Old town walking tour", 8, "Good general fit for most interests, low cost, easy first activity."),
    ("Highly-rated local restaurant", 7, "Food is almost always a safe, high-value recommendation."),
    ("Main museum or landmark", 7, "Popular for a reason — usually worth the visit once."),
    ("Local market or bazaar", 6, "Good for browsing and food, lower time commitment."),
    ("Scenic viewpoint or park", 6, "Nice pace-breaker between busier activities."),
    ("Day trip to a nearby town", 5, "Bigger time investment, worth it only if you have spare days."),
]


def _mock_recommendations(req: RecommendationsRequest) -> list[Recommendation]:
    suffix = f" in {req.destination}" if req.destination else ""
    return [
        Recommendation(
            name=f"{name}{suffix}",
            score=score,
            reason=f"[Mock — set OPENAI_API_KEY or GEMINI_API_KEY for real scoring] {reason}",
        )
        for name, score, reason in _MOCK_POOL
    ]


@router.post("/score", response_model=RecommendationsResponse)
async def score_recommendations(req: RecommendationsRequest):
    interests = ", ".join(req.interests) if req.interests else "general sightseeing"
    prompt = (
        f"Recommend 6 specific, real, named activities/places in {req.destination} for a "
        f"traveler interested in {interests}. Score each 1-10 for how well it fits those "
        "specific interests (10 = perfect fit, not just generically popular). "
        'Respond ONLY with a JSON array, each object with keys "name" (specific real place/activity '
        'name, not generic), "score" (integer 1-10), and "reason" (one short sentence explaining '
        "the score, referencing the traveler's actual interests)."
    )
    raw = await llm.generate_text(prompt, system="You are a discerning local travel expert who gives honest, differentiated scores rather than rating everything highly.")

    if raw is None:
        logger.info("Recommendations: no live provider response, using mock")
        return RecommendationsResponse(recommendations=_mock_recommendations(req))

    parsed = llm.extract_json(raw)

    if isinstance(parsed, dict):
        for value in parsed.values():
            if isinstance(value, list):
                parsed = value
                break

    if not parsed or not isinstance(parsed, list):
        logger.warning("Recommendations: response wasn't a JSON array, using mock. Raw: %r", raw[:500])
        return RecommendationsResponse(recommendations=_mock_recommendations(req))

    try:
        recs = [
            Recommendation(name=str(r["name"]), score=int(r["score"]), reason=str(r["reason"]))
            for r in parsed
        ]
        if not recs:
            raise ValueError("empty recommendations")
        recs.sort(key=lambda r: r.score, reverse=True)
        return RecommendationsResponse(recommendations=recs)
    except (KeyError, ValueError, TypeError) as e:
        logger.warning("Recommendations: couldn't map parsed JSON (%s), using mock. Parsed: %r", e, parsed)
        return RecommendationsResponse(recommendations=_mock_recommendations(req))