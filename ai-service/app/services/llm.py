import json
import logging
import os
import re
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
PROVIDER = os.environ.get("AI_MODEL_PROVIDER", "openai").strip().lower()
# "gemini-flash-latest" is a Google-maintained alias that always points at
# their current recommended Flash model, so it survives model deprecations
# (unlike a pinned version such as "gemini-1.5-flash", which Google has
# since shut down entirely). Override via GEMINI_MODEL if you want a
# specific pinned version instead.
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-latest").strip()


def has_live_provider() -> bool:
    if PROVIDER == "gemini":
        return bool(GEMINI_API_KEY)
    return bool(OPENAI_API_KEY)


async def _call_openai(prompt: str, system: str) -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.7,
            },
        )
        res.raise_for_status()
        data = res.json()
        return data["choices"][0]["message"]["content"]


async def _call_gemini(prompt: str, system: str) -> str:
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}",
            json={
                "contents": [{"parts": [{"text": f"{system}\n\n{prompt}"}]}],
            },
        )
        res.raise_for_status()
        data = res.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


async def generate_text(prompt: str, system: str = "You are a helpful travel assistant.") -> Optional[str]:
    """Returns None if no provider is configured, OR if the provider call
    fails for any reason (rate limit, timeout, transient outage like a 503,
    malformed response, ...). Callers already know how to fall back to a
    clearly-labeled mock response when this returns None — that fallback is
    deliberately reused here too, so a transient upstream failure degrades
    to a mock answer instead of crashing the request with a raw 500."""
    if not has_live_provider():
        return None
    try:
        if PROVIDER == "gemini":
            return await _call_gemini(prompt, system)
        return await _call_openai(prompt, system)
    except httpx.HTTPStatusError as e:
        logger.warning("AI provider returned an error status: %s", e)
        return None
    except httpx.RequestError as e:
        logger.warning("AI provider request failed: %s", e)
        return None
    except (KeyError, IndexError, ValueError) as e:
        logger.warning("AI provider returned an unexpected response shape: %s", e)
        return None


def extract_json(text: str) -> Optional[dict]:
    """Best-effort extraction of a JSON object/array from an LLM response
    that may include surrounding prose or markdown code fences."""
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    candidate = fenced.group(1) if fenced else text
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        # try to grab the first {...} or [...] block
        match = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", candidate)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                return None
    return None