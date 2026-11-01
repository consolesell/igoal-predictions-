# iGoal Predictions — API Specification & Mobile Contract (v2.0)
**Target Package**: `com.example.igoalpredictions`  
**Production Base URL**: `https://api.igoalpredictions.com`  
**Protocol**: HTTPS / REST JSON  
**Rate Limit**: 60 requests / minute per IP or `X-Device-ID` header  

---

## 1. General Standards

1. **Envelope Structure**: All list and data endpoints include a top-level `"source"` key (e.g., `"football-data-v4"`, `"igoal-engine-v1"`, `"settler-v1"`, `"igoal-clubs-v1"`, `"igoal-audit-v1"`).
2. **Timestamps**: Expressed in **Unix epoch SECONDS** (integer/long). Milliseconds must never be used.
3. **Calendar Dates**: Formatted strictly as `YYYY-MM-DD` in UTC (e.g. `2026-10-30`).
4. **Explicit Nulls**: For optional match stats (`homeGoals`, `awayGoals`, `minute`), fields must return literal `null` when unavailable rather than being omitted.
5. **Tip Immutability**: Once published, a tip `id` will never change its market, selection, or confidence. Once settled, tips cannot be deleted.
6. **Soft Delete**: Fixtures marked deleted retain `deletedAt` epoch timestamp and are excluded from public `/v1/fixtures`.
7. **Authentication**:
   - Public Mobile: `X-Device-ID` header.
   - User Account / VIP: `Authorization: Bearer <FIREBASE_ID_TOKEN>`.
   - Admin Operations: `Authorization: Bearer <ADMIN_TOKEN>`.

---

## 2. Public Mobile Endpoints

### 2.1 Health Check
- **Endpoint**: `GET /v1/health`
- **Response `200`**:
```json
{
  "ok": true,
  "version": "2.0.0",
  "mode": "production"
}
```

---

### 2.2 Fixtures Schedule (Phase 2 Enhanced)
- **Endpoint**: `GET /v1/fixtures?date=YYYY-MM-DD`
- **Query Params**: `date` (`^\d{4}-\d{2}-\d{2}$`)
- **Response `200`**:
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
      "minute": null,
      "homeClubId": "club_arsenal",
      "awayClubId": "club_chelsea",
      "homeLogoUrl": "https://storage.googleapis.com/igoal-predictions-prod.appspot.com/clubs/club_arsenal/logo.png",
      "awayLogoUrl": "https://storage.googleapis.com/igoal-predictions-prod.appspot.com/clubs/club_chelsea/logo.png"
    }
  ]
}
```
*Note: Excludes soft-deleted fixtures (`deletedAt != null`). If club logo is not assigned, `homeLogoUrl` and `awayLogoUrl` are `null` and Android uses initials fallback.*

---

### 2.3 Predictions & Tips (Phase 3 VIP Gated)
- **Endpoint**: `GET /v1/tips?tier=free|premium`
- **Headers**: Optional `Authorization: Bearer <TOKEN>`

#### Case A: Free Tier (`tier=free`) — Public
- **Response `200`**:
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
      "modelVersion": "poisson-emp-1.0",
      "homeLogoUrl": "https://storage.googleapis.com/igoal-predictions-prod.appspot.com/clubs/club_arsenal/logo.png",
      "awayLogoUrl": "https://storage.googleapis.com/igoal-predictions-prod.appspot.com/clubs/club_chelsea/logo.png"
    }
  ]
}
```

#### Case B: Premium Tier (`tier=premium`) — Free/Unauthenticated User
- **Response `200`** (Gated paywall payload):
```json
{
  "source": "igoal-engine-v1",
  "tips": [],
  "upgradeRequired": true,
  "message": "VIP subscription required to access premium tips"
}
```

#### Case C: Premium Tier (`tier=premium`) — VIP / Admin User
- **Response `200`**:
```json
{
  "source": "igoal-engine-v1",
  "tips": [
    {
      "id": "tip_20261030_vip_002",
      "fixtureId": "fx_20261030_epl_002",
      "league": "Premier League",
      "home": "Manchester City",
      "away": "Liverpool",
      "kickoff": 1761841800,
      "market": "Over/Under 2.5 Goals",
      "selection": "Over 2.5",
      "confidence": 76,
      "risk": "LOW",
      "explanation": "High attacking tempo; combined expected goals 3.32.",
      "publishedAt": 1761800000,
      "modelVersion": "poisson-emp-1.0",
      "homeLogoUrl": "https://...",
      "awayLogoUrl": "https://..."
    }
  ],
  "upgradeRequired": false
}
```

---

### 2.4 Settlement Results
- **Endpoint**: `GET /v1/results?since={epochSec}`
- **Response `200`**:
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
*Enum: `WON`, `LOST`, `VOID`, `POSTPONED`.*

---

### 2.5 Club Directory & Logos (Phase 2)
- **Endpoint**: `GET /v1/clubs`
- **Response `200`**:
```json
{
  "source": "igoal-clubs-v1",
  "clubs": [
    {
      "id": "club_arsenal",
      "name": "Arsenal FC",
      "shortName": "Arsenal",
      "country": "England",
      "logoPath": "clubs/club_arsenal/logo.png",
      "logoUrl": "https://storage.googleapis.com/igoal-predictions-prod.appspot.com/clubs/club_arsenal/logo.png",
      "updatedAt": 1761800000
    }
  ]
}
```

---

### 2.6 User Profile & Entitlements (Phase 3)
- **Endpoint**: `GET /v1/me`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response `200`**:
```json
{
  "uid": "usr_99812",
  "email": "user@example.com",
  "displayName": "Alex Smith",
  "role": "user",
  "tier": "vip",
  "expiresAt": 1764424800,
  "isVip": true
}
```

---

## 3. Protected Admin API Endpoints

*All endpoints in this section require `Authorization: Bearer <ADMIN_TOKEN>`.*

### 3.1 Create Fixture
- **Endpoint**: `POST /v1/admin/fixtures`
- **Body**:
```json
{
  "league": "Premier League",
  "country": "England",
  "home": "Arsenal",
  "away": "Chelsea",
  "kickoff": 1761832800,
  "status": "SCHEDULED",
  "homeClubId": "club_arsenal",
  "awayClubId": "club_chelsea"
}
```

### 3.2 Update Fixture
- **Endpoint**: `PATCH /v1/admin/fixtures/{id}`
- **Body**: Partial update (`status`, `homeGoals`, `awayGoals`, `minute`, `kickoff`, etc.)

### 3.3 Delete Fixture (Soft-Delete)
- **Endpoint**: `DELETE /v1/admin/fixtures/{id}?force=true|false`
- **Rule**: If fixture has settled tips, call fails with HTTP 400 unless `force=true`.

### 3.4 Manual Tip Publish & Delete
- **Endpoint**: `POST /v1/admin/tips` (Body: `fixtureId`, `market`, `selection`, `confidence`, `risk`, `explanation`, `tier`)
- **Endpoint**: `DELETE /v1/admin/tips/{id}` (Fails with HTTP 400 if tip has already been settled).

### 3.5 Force Settlement
- **Endpoint**: `POST /v1/admin/settlements`
- **Body**: `{"predictionId": "tip_...", "status": "WON", "homeGoals": 2, "awayGoals": 1}`

### 3.6 Club Logo Upload (Phase 2 Firebase Storage)
- **Endpoint**: `POST /v1/admin/clubs/{clubId}/logo`
- **Body**: `{"logoUrl": "https://..."}`
- **Effect**: Updates club record and auto-refreshes all fixture `homeLogoUrl` and `awayLogoUrl` fields.

### 3.7 User VIP Entitlement Grant (Phase 3)
- **Endpoint**: `POST /v1/admin/users/entitlement`
- **Body**: `{"uid": "usr_123", "tier": "vip", "days": 30}`

### 3.8 Auto-Dictate Fixture Logos (Batch)
- **Endpoint**: `POST /v1/admin/fixtures/auto-dictate`
- **Effect**: Scans all managed fixtures and automatically detects, resolves, and links official high-res club badges based on fuzzy word matching, prefix stripping, and token sorting.

### 3.9 Audit Logs Listing
- **Endpoint**: `GET /v1/admin/audit`
- **Response**: List of logged actions (`FIXTURE_CREATE`, `FIXTURE_UPDATE`, `FIXTURE_DELETE`, `LOGO_UPLOAD`, `VIP_GRANT`, `AUTO_DICTATE_FIXTURES`, etc.).

---

## 3.10 Intelligent Auto-Dictation API
- **Endpoint**: `GET /v1/clubs/dictate?name={query}` or `POST /v1/clubs/dictate`
- **Purpose**: Normalizes and dictates club records even with misplaced words (`"Madrid Real"`), formal prefixes (`"FC Arsenal"`, `"AFC Bournemouth"`, `"1. FC Union Berlin"`), or abbreviations (`"bvb"`, `"psg"`, `"Spurs"`).
- **Response `200`**:
```json
{
  "source": "igoal-dictation-engine-v1",
  "query": "Madrid Real",
  "result": {
    "club": {
      "id": "club_realmadrid",
      "name": "Real Madrid CF",
      "shortName": "Real Madrid",
      "country": "Spain",
      "league": "La Liga",
      "fotmobId": 8633,
      "logoUrl": "https://images.fotmob.com/image_resources/logo/teamlogo/8633.png"
    },
    "confidence": 95,
    "matchReason": "Misplaced words resolved (ordered tokens match 'Real Madrid CF')"
  }
}
```

---

## 4. Notifications & FCM Channels (Phase 4)

- **FCM Channels**:
  1. `match_reminders`: Upcoming kickoff notifications with odds and match preview.
  2. `settlement_results`: Real-time notification when prediction outcome is verified.
  3. `system_alerts`: Important updates and announcements.
- **Admin Broadcast**: `POST /v1/admin/notifications/broadcast`
