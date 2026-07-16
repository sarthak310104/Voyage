from app.services import llm


def test_extract_json_plain():
    assert llm.extract_json('{"a": 1}') == {"a": 1}


def test_extract_json_fenced():
    text = 'Here is the result:\n```json\n{"a": 1, "b": [1, 2, 3]}\n```\nHope that helps!'
    assert llm.extract_json(text) == {"a": 1, "b": [1, 2, 3]}


def test_extract_json_array_embedded_in_prose():
    text = 'Sure, here you go: [{"day": 1, "title": "Arrival"}] enjoy!'
    assert llm.extract_json(text) == [{"day": 1, "title": "Arrival"}]


def test_extract_json_garbage_returns_none():
    assert llm.extract_json("not json at all, sorry") is None


async def test_generate_text_returns_none_without_provider(monkeypatch):
    monkeypatch.setattr(llm, "OPENAI_API_KEY", "")
    monkeypatch.setattr(llm, "GEMINI_API_KEY", "")
    result = await llm.generate_text("hello")
    assert result is None