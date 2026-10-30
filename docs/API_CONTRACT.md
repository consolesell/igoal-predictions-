# iGoal Predictions — API Specification & Mobile Contract
**Target Package**: `com.example.igoalpredictions`  
**Production Base URL**: `https://api.igoalpredictions.com`  
**Protocol**: HTTPS / REST JSON  
**Rate Limit**: 60 requests / minute per IP or `X-Device-ID`  

---

## 1. General Standards

1. **Envelope Structure**: All list and data endpoints include a top-level `"source"` key (e.g., `"football-data-v4"`, `"igoal-engine-v1"`, `"settler-v1"`).
2. **Timestamps**: Expressed in **Unix epoch SECONDS** (integer/long). Milliseconds must never be used.
3. **Calendar Dates**: Formatted strictly as `YYYY-MM-DD` in UTC (e.g. `2026-10-30`).
4. **Explicit Nulls**: For optional match stats (`homeGoals`, `awayGoals`, `minute`), fields must return literal `null` when unavailable rather than being omitted.
5. **Tip Immutability**: Once published, a tip `id` will never change its market, selection, or confidence.

---

## 2. Endpoints

### 2.1 Health Check
- **Endpoint**: `GET /v1/health`
- **Status**: `200 OK`
- **Response Payload**:
```json
{
  "ok": true,
  "version": "2.0.0",
  "mode": "production"
}
```

---

### 2.2 Fixtures Schedule
- **Endpoint**: `GET /v1/fixtures?date=YYYY-MM-DD`
- **Query Params**:
  - `date`: `string` matching `^\d{4}-\d{2}-\d{2}$` (Required).
- **Status**: `200 OK`
- **Response Payload**:
```json
{
  "source": "football-data-v4",
  "fixtures": [
    {
      "id": "fx_20261030_epl_001",
      "league": "Premier League",
      "country": "England",
      "home": "Arsenal",
      "away": "Chelsea",
      "kickoff": 1761832800,
      "status": "SCHEDULED",
      "homeGoals": null,
      "awayGoals": null,
      "minute": null
    }
  ]
}
```
- **Status Enum**: `SCHEDULED`, `LIVE`, `FINISHED`, `POSTPONED`

---

### 2.3 Predictions & Tips
- **Endpoint**: `GET /v1/tips?tier=free|premium`
- **Query Params**:
  - `tier`: `free` (default) or `premium`.
- **Status**: `200 OK`
- **Response Payload**:
```json
{
  "source": "igoal-engine-v1",
  "tips": [
    {
      "id": "tip_20261030_001",
      "fixtureId": "fx_20261030_epl_001",
      "league": "Premier League",
      "home": "Arsenal",
      "away": "Chelsea",
      "kickoff": 1761832800,
      "market": "Match Winner (1X2)",
      "selection": "Home win",
      "confidence": 68,
      "risk": "MEDIUM",
      "explanation": "Poisson lean home; models agree within 8 points.",
      "publishedAt": 1761800000,
      "modelVersion": "poisson-emp-1.0"
    }
  ]
}
```
- **Risk Enum**: `LOW`, `MEDIUM`, `HIGH`
- **Confidence Range**: `0` to `100` inclusive.

---

### 2.4 Settlement Results
- **Endpoint**: `GET /v1/results?since={epochSec}`
- **Query Params**:
  - `since`: `integer` Unix epoch seconds (Default `0`).
- **Status**: `200 OK`
- **Response Payload**:
```json
{
  "source": "settler-v1",
  "results": [
    {
      "predictionId": "tip_20261030_001",
      "status": "WON",
      "homeGoals": 2,
      "awayGoals": 1,
      "settledAt": 1761840000
    }
  ]
}
```
- **Settlement Status Enum**: `WON`, `LOST`, `VOID`, `POSTPONED`

---

## 3. Error Responses

- **400 Bad Request**:
```json
{
  "error": "Invalid date format. Expected yyyy-MM-dd."
}
```

- **429 Too Many Requests**:
```json
{
  "error": "Too Many Requests"
}
```

- **500 Internal Server Error**:
```json
{
  "error": "Internal server error"
}
```
