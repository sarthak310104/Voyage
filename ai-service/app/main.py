from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import itinerary, chat, packing, journal
from app.services import llm

app = FastAPI(title="Travel Companion AI Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(itinerary.router)
app.include_router(chat.router)
app.include_router(packing.router)
app.include_router(journal.router)


@app.get("/health")
def health():
    return {"status": "ok", "live_ai_provider_configured": llm.has_live_provider()}
