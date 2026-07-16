from fastapi import APIRouter

from app.models.schemas import ChatRequest, ChatResponse
from app.services import llm

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    system = (
        "You are a concise, friendly travel assistant helping with an in-progress trip. "
        "Match your reply's length and structure to the question: a greeting or simple "
        "one-line question gets a short, casual, ONE-TO-TWO-SENTENCE reply — no headers, "
        "no bullet list, no self-introduction or list of capabilities unless asked for one. "
        "Only reach for Markdown structure (short paragraphs, **bold** for key names/numbers, "
        "bullet or numbered lists) when the answer genuinely has multiple options, steps, or "
        "items (e.g. restaurant suggestions, a multi-step answer, a price breakdown). Never "
        "pad a simple answer with extra structure just to fill space — this renders in a small "
        "chat widget, not a full page, and a big reply to \"hi\" is a bug, not a feature."
    )
    context = f" Context: {req.tripContext}." if req.tripContext else ""
    prompt = f"{req.message}{context}"

    reply = await llm.generate_text(prompt, system=system)
    if reply is None:
        reply = (
            "[Mock reply — set OPENAI_API_KEY or GEMINI_API_KEY for real answers] "
            f"Here's a placeholder response to: \"{req.message}\""
        )
    return ChatResponse(reply=reply.strip())
