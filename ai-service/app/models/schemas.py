from typing import List, Optional
from pydantic import BaseModel, Field


class ItineraryGenerateRequest(BaseModel):
    destination: str
    days: int = Field(ge=1, le=30)
    interests: List[str] = []


class ItineraryDay(BaseModel):
    day: int
    title: str
    notes: str
    location: str = ""


class ItineraryGenerateResponse(BaseModel):
    itinerary: List[ItineraryDay]


class ChatRequest(BaseModel):
    message: str
    tripContext: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str


class PackingSuggestRequest(BaseModel):
    destination: str
    days: int = Field(ge=1, le=60)
    season: str = "summer"


class PackingSuggestResponse(BaseModel):
    items: List[str]


class JournalItineraryEntry(BaseModel):
    day: int
    title: str
    notes: str = ""


class JournalExpenseEntry(BaseModel):
    description: str
    amount: float
    category: str


class JournalGenerateRequest(BaseModel):
    destination: str
    startDate: str
    endDate: str
    itinerary: List[JournalItineraryEntry] = []
    expenses: List[JournalExpenseEntry] = []


class JournalGenerateResponse(BaseModel):
    title: str
    narrative: str
    highlights: List[str]
