from app.models.schemas import ItineraryGenerateRequest, PackingSuggestRequest
from app.routers.itinerary import _mock_itinerary
from app.routers.packing import _mock_packing


def test_mock_itinerary_has_one_entry_per_day():
    req = ItineraryGenerateRequest(destination="Lisbon", days=3, interests=["food"])
    result = _mock_itinerary(req)
    assert len(result) == 3
    assert [d.day for d in result] == [1, 2, 3]
    assert all(d.location for d in result)


def test_mock_packing_includes_season_items():
    req = PackingSuggestRequest(destination="Reykjavik", days=5, season="winter")
    items = _mock_packing(req)
    assert "Warm coat" in items
    assert "Passport / ID" in items