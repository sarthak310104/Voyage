import logging

from fastapi import APIRouter

from app.models.schemas import JournalGenerateRequest, JournalGenerateResponse
from app.services import llm

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/journal", tags=["journal"])


def _mock_journal(req: JournalGenerateRequest) -> JournalGenerateResponse:
    total_spent = sum(e.amount for e in req.expenses)
    day_count = len(req.itinerary) or ((req.endDate and req.startDate) and 1) or 1
    highlights = [item.title for item in req.itinerary[:5]] or [f"Time in {req.destination}"]
    narrative = (
        f"[Mock — set OPENAI_API_KEY or GEMINI_API_KEY for a real AI-written journal] "
        f"From {req.startDate} to {req.endDate}, this trip to {req.destination} covered "
        f"{day_count} planned day(s) and ${total_spent:,.2f} in recorded expenses. "
        "A proper narrative would weave the itinerary highlights and spending into a "
        "short, warm retelling of the trip."
    )
    return JournalGenerateResponse(
        title=f"{req.destination}, {req.startDate} – {req.endDate}",
        narrative=narrative,
        highlights=highlights,
    )


@router.post("/generate", response_model=JournalGenerateResponse)
async def generate_journal(req: JournalGenerateRequest):
    itinerary_lines = "\n".join(f"Day {i.day}: {i.title} — {i.notes}" for i in req.itinerary) or "No itinerary recorded."
    expense_lines = "\n".join(f"{e.description} ({e.category}): ${e.amount:.2f}" for e in req.expenses)
    total_spent = sum(e.amount for e in req.expenses)

    prompt = (
        f"Write a short, warm travel journal entry (150-250 words) for a trip to {req.destination} "
        f"from {req.startDate} to {req.endDate}. Base it on this itinerary:\n{itinerary_lines}\n\n"
        f"And these expenses (total ${total_spent:.2f}):\n{expense_lines or 'none recorded'}\n\n"
        "Respond ONLY with a JSON object with keys \"title\" (a short evocative title for the journal entry), "
        "\"narrative\" (the journal entry itself, first person plural \"we\"), and \"highlights\" "
        "(a JSON array of 3-5 short highlight strings, one per notable moment)."
    )
    raw = await llm.generate_text(prompt, system="You are a travel writer turning trip logistics into a warm journal entry.")

    if raw is None:
        logger.info("Journal generation: no live provider response, using mock")
        return _mock_journal(req)

    parsed = llm.extract_json(raw)
    if not parsed or not isinstance(parsed, dict):
        logger.warning("Journal generation: response wasn't a JSON object, using mock. Raw: %r", raw[:500])
        return _mock_journal(req)

    try:
        return JournalGenerateResponse(
            title=str(parsed["title"]),
            narrative=str(parsed["narrative"]),
            highlights=[str(h) for h in parsed.get("highlights", [])] or [req.destination],
        )
    except (KeyError, TypeError) as e:
        logger.warning("Journal generation: couldn't map parsed JSON (%s), using mock. Parsed: %r", e, parsed)
        return _mock_journal(req)