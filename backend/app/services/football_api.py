import logging
import time
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import httpx
from backend.app.config import settings

logger = logging.getLogger(__name__)

VALID_STATUSES = {"SCHEDULED", "LIVE", "FINISHED", "POSTPONED"}

class FootballApiService:
    def __init__(self):
        self.api_key = settings.FOOTBALL_DATA_API_KEY
        self.source = settings.FOOTBALL_DATA_SOURCE

    async def fetch_fixtures_for_date(self, target_date: str) -> List[Dict[str, Any]]:
        """
        Fetch fixtures for a given calendar day (YYYY-MM-DD UTC).
        Filters out invalid or unknown statuses.
        Explicitly keeps home_goals, away_goals, and minute as null when unavailable.
        """
        # If external API is configured, call provider (e.g. football-data.org v4)
        if self.api_key:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    headers = {"X-Auth-Token": self.api_key}
                    url = f"https://api.football-data.org/v4/matches?dateFrom={target_date}&dateTo={target_date}"
                    response = await client.get(url, headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        return self._normalize_external_matches(data.get("matches", []))
                    else:
                        logger.warning(f"Football API returned HTTP {response.status_code}, falling back to local pool")
            except Exception as e:
                logger.error(f"Error fetching from external Football API: {e}")

        # Return empty list if external fails or no key; database or seeder handles storage
        return []

    def _normalize_external_matches(self, matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        normalized = []
        for m in matches:
            status_map = {
                "SCHEDULED": "SCHEDULED",
                "TIMED": "SCHEDULED",
                "IN_PLAY": "LIVE",
                "PAUSED": "LIVE",
                "FINISHED": "FINISHED",
                "AWARDED": "FINISHED",
                "POSTPONED": "POSTPONED",
                "CANCELLED": "POSTPONED",
                "SUSPENDED": "POSTPONED"
            }
            raw_status = m.get("status", "")
            mapped_status = status_map.get(raw_status)
            if not mapped_status or mapped_status not in VALID_STATUSES:
                continue

            # Parse kickoff timestamp in epoch seconds
            utc_date_str = m.get("utcDate", "")
            kickoff_sec = int(time.time())
            try:
                dt = datetime.fromisoformat(utc_date_str.replace("Z", "+00:00"))
                kickoff_sec = int(dt.timestamp())
            except Exception:
                pass

            score = m.get("score", {}).get("fullTime", {})
            home_goals = score.get("home")
            away_goals = score.get("away")
            minute = m.get("minute")

            normalized.append({
                "id": f"fx_{m.get('id')}",
                "league": m.get("competition", {}).get("name", "Unknown League"),
                "country": m.get("area", {}).get("name", "International"),
                "home": m.get("homeTeam", {}).get("name", "Home Team"),
                "away": m.get("awayTeam", {}).get("name", "Away Team"),
                "kickoff": kickoff_sec,
                "status": mapped_status,
                "home_goals": home_goals if mapped_status in ("LIVE", "FINISHED") else None,
                "away_goals": away_goals if mapped_status in ("LIVE", "FINISHED") else None,
                "minute": minute if mapped_status == "LIVE" else None
            })
        return normalized

football_api_service = FootballApiService()
