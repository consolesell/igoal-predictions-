import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// ------------------------------------------------------------------------------
// Configuration & Constants
// ------------------------------------------------------------------------------
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'igoal_admin_secret_2026';
const CRON_SECRET = process.env.CRON_SECRET || 'igoal_cron_worker_secret_2026';
const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'igoal-predictions-prod.appspot.com';
const FIREBASE_STORAGE_BASE_URL = `https://storage.googleapis.com/${FIREBASE_STORAGE_BUCKET}`;

// ------------------------------------------------------------------------------
// Rate Limiter: 60 requests/minute per IP or X-Device-ID
// ------------------------------------------------------------------------------
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip rate limiting for static assets and UI routes
  if (!req.path.startsWith('/v1')) {
    return next();
  }

  const deviceId = (req.headers['x-device-id'] as string) || req.ip || 'unknown-client';
  const now = Date.now();
  const record = rateLimitStore.get(deviceId);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(deviceId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX);
    res.setHeader('X-RateLimit-Remaining', RATE_LIMIT_MAX - 1);
    return next();
  }

  if (record.count >= RATE_LIMIT_MAX) {
    res.setHeader('Retry-After', Math.ceil((record.resetAt - now) / 1000));
    return res.status(429).json({ error: 'Too Many Requests' });
  }

  record.count += 1;
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX);
  res.setHeader('X-RateLimit-Remaining', RATE_LIMIT_MAX - record.count);
  next();
}

app.use(rateLimiterMiddleware);

// ------------------------------------------------------------------------------
// Data Models & Interfaces
// ------------------------------------------------------------------------------
export interface ClubRecord {
  id: string;
  name: string;
  shortName: string;
  country: string;
  logoPath: string | null; // clubs/{clubId}/logo.png
  logoUrl: string | null;
  updatedAt: number; // Unix epoch SECONDS
}

export interface FixtureRecord {
  id: string;
  league: string;
  country: string;
  home: string;
  away: string;
  kickoff: number; // Unix epoch SECONDS
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';
  homeGoals: number | null;
  awayGoals: number | null;
  minute: number | null;
  homeClubId: string | null;
  awayClubId: string | null;
  homeLogoUrl: string | null;
  awayLogoUrl: string | null;
  deletedAt: number | null; // Unix epoch SECONDS (null = active)
}

export interface TipRecord {
  id: string;
  fixtureId: string;
  league: string;
  home: string;
  away: string;
  kickoff: number; // Unix epoch SECONDS
  market: string;
  selection: string;
  confidence: number; // 0 - 100
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
  publishedAt: number; // Unix epoch SECONDS
  modelVersion: string;
  tier: 'free' | 'premium';
  homeLogoUrl: string | null;
  awayLogoUrl: string | null;
}

export interface SettlementRecord {
  predictionId: string;
  status: 'WON' | 'LOST' | 'VOID' | 'POSTPONED';
  homeGoals: number;
  awayGoals: number;
  settledAt: number; // Unix epoch SECONDS
}

export interface UserRecord {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'user' | 'admin';
  tier: 'free' | 'vip';
  vipExpiresAt: number | null; // Unix epoch SECONDS
  createdAt: number;
  updatedAt: number;
}

export interface AuditLogRecord {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string | null;
  createdAt: number; // Unix epoch SECONDS
}

// ------------------------------------------------------------------------------
// In-Memory Database Store (Mirroring PostgreSQL Database)
// ------------------------------------------------------------------------------
const TODAY_EPOCH_START = Math.floor(new Date('2026-10-30T00:00:00Z').getTime() / 1000);
const YESTERDAY_EPOCH_START = TODAY_EPOCH_START - 86400;

// High-fidelity Club Logos (using reliable CDN badges with Firebase Storage paths)
let clubs: ClubRecord[] = [
  {
    id: 'club_arsenal',
    name: 'Arsenal FC',
    shortName: 'Arsenal',
    country: 'England',
    logoPath: 'clubs/club_arsenal/logo.png',
    logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9825.png',
    updatedAt: TODAY_EPOCH_START,
  },
  {
    id: 'club_chelsea',
    name: 'Chelsea FC',
    shortName: 'Chelsea',
    country: 'England',
    logoPath: 'clubs/club_chelsea/logo.png',
    logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8455.png',
    updatedAt: TODAY_EPOCH_START,
  },
  {
    id: 'club_mancity',
    name: 'Manchester City FC',
    shortName: 'Man City',
    country: 'England',
    logoPath: 'clubs/club_mancity/logo.png',
    logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8456.png',
    updatedAt: TODAY_EPOCH_START,
  },
  {
    id: 'club_liverpool',
    name: 'Liverpool FC',
    shortName: 'Liverpool',
    country: 'England',
    logoPath: 'clubs/club_liverpool/logo.png',
    logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8650.png',
    updatedAt: TODAY_EPOCH_START,
  },
  {
    id: 'club_realmadrid',
    name: 'Real Madrid CF',
    shortName: 'Real Madrid',
    country: 'Spain',
    logoPath: 'clubs/club_realmadrid/logo.png',
    logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8633.png',
    updatedAt: TODAY_EPOCH_START,
  },
  {
    id: 'club_barcelona',
    name: 'FC Barcelona',
    shortName: 'Barcelona',
    country: 'Spain',
    logoPath: 'clubs/club_barcelona/logo.png',
    logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8634.png',
    updatedAt: TODAY_EPOCH_START,
  },
  {
    id: 'club_inter',
    name: 'Inter Milan',
    shortName: 'Inter',
    country: 'Italy',
    logoPath: 'clubs/club_inter/logo.png',
    logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8636.png',
    updatedAt: TODAY_EPOCH_START,
  },
  {
    id: 'club_juventus',
    name: 'Juventus FC',
    shortName: 'Juventus',
    country: 'Italy',
    logoPath: 'clubs/club_juventus/logo.png',
    logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9885.png',
    updatedAt: TODAY_EPOCH_START,
  },
  {
    id: 'club_bayern',
    name: 'FC Bayern Munich',
    shortName: 'Bayern',
    country: 'Germany',
    logoPath: 'clubs/club_bayern/logo.png',
    logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9823.png',
    updatedAt: TODAY_EPOCH_START,
  },
  {
    id: 'club_dortmund',
    name: 'Borussia Dortmund',
    shortName: 'Dortmund',
    country: 'Germany',
    logoPath: 'clubs/club_dortmund/logo.png',
    logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9789.png',
    updatedAt: TODAY_EPOCH_START,
  },
  {
    id: 'club_psg',
    name: 'Paris Saint-Germain',
    shortName: 'PSG',
    country: 'France',
    logoPath: 'clubs/club_psg/logo.png',
    logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9847.png',
    updatedAt: TODAY_EPOCH_START,
  },
  {
    id: 'club_atletico',
    name: 'Atletico Madrid',
    shortName: 'Atletico',
    country: 'Spain',
    logoPath: 'clubs/club_atletico/logo.png',
    logoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9906.png',
    updatedAt: TODAY_EPOCH_START,
  },
];

let fixtures: FixtureRecord[] = [
  {
    id: 'fx_20261030_epl_001',
    league: 'Premier League',
    country: 'England',
    home: 'Arsenal',
    away: 'Chelsea',
    kickoff: TODAY_EPOCH_START + 17 * 3600,
    status: 'SCHEDULED',
    homeGoals: null,
    awayGoals: null,
    minute: null,
    homeClubId: 'club_arsenal',
    awayClubId: 'club_chelsea',
    homeLogoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9825.png',
    awayLogoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8455.png',
    deletedAt: null,
  },
  {
    id: 'fx_20261030_epl_002',
    league: 'Premier League',
    country: 'England',
    home: 'Manchester City',
    away: 'Liverpool',
    kickoff: TODAY_EPOCH_START + 19 * 3600 + 1800,
    status: 'SCHEDULED',
    homeGoals: null,
    awayGoals: null,
    minute: null,
    homeClubId: 'club_mancity',
    awayClubId: 'club_liverpool',
    homeLogoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8456.png',
    awayLogoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8650.png',
    deletedAt: null,
  },
  {
    id: 'fx_20261030_laliga_001',
    league: 'La Liga',
    country: 'Spain',
    home: 'Real Madrid',
    away: 'Barcelona',
    kickoff: TODAY_EPOCH_START + 20 * 3600,
    status: 'SCHEDULED',
    homeGoals: null,
    awayGoals: null,
    minute: null,
    homeClubId: 'club_realmadrid',
    awayClubId: 'club_barcelona',
    homeLogoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8633.png',
    awayLogoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8634.png',
    deletedAt: null,
  },
  {
    id: 'fx_20261030_seriea_001',
    league: 'Serie A',
    country: 'Italy',
    home: 'Inter Milan',
    away: 'Juventus',
    kickoff: TODAY_EPOCH_START + 18 * 3600 + 1800,
    status: 'SCHEDULED',
    homeGoals: null,
    awayGoals: null,
    minute: null,
    homeClubId: 'club_inter',
    awayClubId: 'club_juventus',
    homeLogoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8636.png',
    awayLogoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9885.png',
    deletedAt: null,
  },
  {
    id: 'fx_20261030_bundesliga_001',
    league: 'Bundesliga',
    country: 'Germany',
    home: 'Bayern Munich',
    away: 'Borussia Dortmund',
    kickoff: TODAY_EPOCH_START + 16 * 3600 + 1800,
    status: 'LIVE',
    homeGoals: 2,
    awayGoals: 1,
    minute: 67,
    homeClubId: 'club_bayern',
    awayClubId: 'club_dortmund',
    homeLogoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9823.png',
    awayLogoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9789.png',
    deletedAt: null,
  },
  {
    id: 'fx_20261029_ucl_001',
    league: 'Champions League',
    country: 'Europe',
    home: 'Paris Saint-Germain',
    away: 'Atletico Madrid',
    kickoff: YESTERDAY_EPOCH_START + 19 * 3600,
    status: 'FINISHED',
    homeGoals: 2,
    awayGoals: 1,
    minute: 90,
    homeClubId: 'club_psg',
    awayClubId: 'club_atletico',
    homeLogoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9847.png',
    awayLogoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9906.png',
    deletedAt: null,
  },
];

let tips: TipRecord[] = [
  {
    id: 'tip_20261030_epl_001',
    fixtureId: 'fx_20261030_epl_001',
    league: 'Premier League',
    home: 'Arsenal',
    away: 'Chelsea',
    kickoff: TODAY_EPOCH_START + 17 * 3600,
    market: 'Match Winner (1X2)',
    selection: 'Home win',
    confidence: 68,
    risk: 'MEDIUM',
    explanation: 'Poisson lean home (xG 1.82 vs 1.14); models agree within 8 points.',
    publishedAt: TODAY_EPOCH_START - 3600,
    modelVersion: 'poisson-emp-1.0',
    tier: 'free',
    homeLogoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9825.png',
    awayLogoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8455.png',
  },
  {
    id: 'tip_20261030_epl_002',
    fixtureId: 'fx_20261030_epl_002',
    league: 'Premier League',
    home: 'Manchester City',
    away: 'Liverpool',
    kickoff: TODAY_EPOCH_START + 19 * 3600 + 1800,
    market: 'Over/Under 2.5 Goals',
    selection: 'Over 2.5',
    confidence: 76,
    risk: 'LOW',
    explanation: 'High attacking tempo; combined expected goals 3.32 exceed 2.5 threshold.',
    publishedAt: TODAY_EPOCH_START - 3600,
    modelVersion: 'poisson-emp-1.0',
    tier: 'premium',
    homeLogoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8456.png',
    awayLogoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/8650.png',
  },
  {
    id: 'tip_20261029_ucl_001',
    fixtureId: 'fx_20261029_ucl_001',
    league: 'Champions League',
    home: 'Paris Saint-Germain',
    away: 'Atletico Madrid',
    kickoff: YESTERDAY_EPOCH_START + 19 * 3600,
    market: 'Match Winner (1X2)',
    selection: 'Home win',
    confidence: 71,
    risk: 'LOW',
    explanation: 'Poisson lean home; superior home expected chance creation.',
    publishedAt: YESTERDAY_EPOCH_START - 7200,
    modelVersion: 'poisson-emp-1.0',
    tier: 'free',
    homeLogoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9847.png',
    awayLogoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/9906.png',
  },
];

let settlementResults: SettlementRecord[] = [
  {
    predictionId: 'tip_20261029_ucl_001',
    status: 'WON',
    homeGoals: 2,
    awayGoals: 1,
    settledAt: YESTERDAY_EPOCH_START + 21 * 3600 + 1800,
  },
];

let users: UserRecord[] = [
  {
    uid: 'admin_master',
    email: 'admin@igoalpredictions.com',
    displayName: 'Head Analyst (Admin)',
    role: 'admin',
    tier: 'vip',
    vipExpiresAt: null,
    createdAt: TODAY_EPOCH_START - 86400 * 30,
    updatedAt: TODAY_EPOCH_START,
  },
  {
    uid: 'vip_demo_user',
    email: 'vip_subscriber@gmail.com',
    displayName: 'Alex Smith (Gold VIP)',
    role: 'user',
    tier: 'vip',
    vipExpiresAt: Math.floor(Date.now() / 1000) + 30 * 86400,
    createdAt: TODAY_EPOCH_START - 86400 * 10,
    updatedAt: TODAY_EPOCH_START,
  },
  {
    uid: 'free_demo_user',
    email: 'casual_fan@gmail.com',
    displayName: 'Jordan Lee (Free Tier)',
    role: 'user',
    tier: 'free',
    vipExpiresAt: null,
    createdAt: TODAY_EPOCH_START - 86400 * 5,
    updatedAt: TODAY_EPOCH_START,
  },
];

let auditLogs: AuditLogRecord[] = [
  {
    id: 'audit_init_001',
    actorId: 'admin_master',
    action: 'SYSTEM_BOOT',
    targetType: 'system',
    targetId: 'backend_v2',
    details: JSON.stringify({ message: 'iGoal Predictions v2.0 initialized with Clubs, Logos, and VIP Entitlements.' }),
    createdAt: Math.floor(Date.now() / 1000) - 3600,
  },
  {
    id: 'audit_init_002',
    actorId: 'admin_master',
    action: 'FIXTURE_CREATE',
    targetType: 'fixture',
    targetId: 'fx_20261030_epl_001',
    details: JSON.stringify({ match: 'Arsenal vs Chelsea', league: 'Premier League' }),
    createdAt: Math.floor(Date.now() / 1000) - 1800,
  },
];

function logAudit(actorId: string, action: string, targetType: string, targetId: string, details?: any) {
  const entry: AuditLogRecord = {
    id: `audit_${Date.now()}_${targetId.substring(0, 8)}`,
    actorId,
    action,
    targetType,
    targetId,
    details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null,
    createdAt: Math.floor(Date.now() / 1000),
  };
  auditLogs.unshift(entry);
}

// ------------------------------------------------------------------------------
// Authentication & User Extraction Helper
// ------------------------------------------------------------------------------
function authenticateUser(req: Request): UserRecord | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split('Bearer ')[1].trim();

  // Admin Master Token
  if (token === ADMIN_TOKEN) {
    return users.find((u) => u.uid === 'admin_master') || null;
  }

  // VIP Token aliases
  if (token === 'demo_vip_token' || token.startsWith('token_vip_')) {
    return users.find((u) => u.uid === 'vip_demo_user') || null;
  }

  // Free Token aliases
  if (token === 'demo_free_token' || token.startsWith('token_free_')) {
    return users.find((u) => u.uid === 'free_demo_user') || null;
  }

  // Lookup in users table by uid or token
  return users.find((u) => u.uid === token) || null;
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Admin authentication required. Missing or invalid Bearer token.' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Administrator privileges required.' });
  }
  (req as any).user = user;
  next();
}

// ------------------------------------------------------------------------------
// PUBLIC API ENDPOINTS (docs/API_CONTRACT.md)
// ------------------------------------------------------------------------------

/**
 * 1. GET /v1/health
 */
app.get('/v1/health', (req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    version: '2.0.0',
    mode: 'production',
  });
});

/**
 * 2. GET /v1/fixtures?date=YYYY-MM-DD
 */
app.get('/v1/fixtures', (req: Request, res: Response) => {
  const dateStr = req.query.date as string;

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return res.status(400).json({
      error: 'Invalid date format. Expected yyyy-MM-dd.',
    });
  }

  const startUtc = Math.floor(new Date(`${dateStr}T00:00:00Z`).getTime() / 1000);
  const endUtc = startUtc + 86400;

  if (isNaN(startUtc)) {
    return res.status(400).json({
      error: 'Invalid calendar date.',
    });
  }

  // Exclude soft-deleted (deletedAt != null)
  const activeFixtures = fixtures
    .filter((f) => f.deletedAt === null && f.kickoff >= startUtc && f.kickoff < endUtc)
    .map((f) => ({
      id: f.id,
      league: f.league,
      country: f.country,
      home: f.home,
      away: f.away,
      kickoff: f.kickoff,
      status: f.status,
      // Strict nulls when unavailable
      homeGoals: f.status === 'LIVE' || f.status === 'FINISHED' ? f.homeGoals : null,
      awayGoals: f.status === 'LIVE' || f.status === 'FINISHED' ? f.awayGoals : null,
      minute: f.status === 'LIVE' ? f.minute : null,
      // Denormalized club logos (Phase 2)
      homeClubId: f.homeClubId,
      awayClubId: f.awayClubId,
      homeLogoUrl: f.homeLogoUrl,
      awayLogoUrl: f.awayLogoUrl,
    }));

  res.status(200).json({
    source: 'football-data-v4',
    fixtures: activeFixtures,
  });
});

/**
 * 3. GET /v1/tips?tier=free|premium
 * Phase 3 Entitlement Gate: Premium tier requires VIP or Admin.
 */
app.get('/v1/tips', (req: Request, res: Response) => {
  const tier = (req.query.tier as string) || 'free';

  if (tier !== 'free' && tier !== 'premium') {
    return res.status(400).json({
      error: "Invalid tier parameter. Allowed values: 'free' or 'premium'.",
    });
  }

  const user = authenticateUser(req);
  const isVip = user && (user.role === 'admin' || (user.tier === 'vip' && (!user.vipExpiresAt || user.vipExpiresAt > Date.now() / 1000)));

  // Phase 3 Entitlement check for Premium tier
  if (tier === 'premium' && !isVip) {
    return res.status(200).json({
      source: 'igoal-engine-v1',
      tips: [],
      upgradeRequired: true,
      message: 'VIP subscription required to access premium tips',
    });
  }

  const filteredTips = tips
    .filter((t) => t.tier === tier)
    .map((t) => ({
      id: t.id,
      fixtureId: t.fixtureId,
      league: t.league,
      home: t.home,
      away: t.away,
      kickoff: t.kickoff,
      market: t.market,
      selection: t.selection,
      confidence: t.confidence,
      risk: t.risk,
      explanation: t.explanation,
      publishedAt: t.publishedAt,
      modelVersion: t.modelVersion,
      homeLogoUrl: t.homeLogoUrl,
      awayLogoUrl: t.awayLogoUrl,
    }));

  res.status(200).json({
    source: 'igoal-engine-v1',
    tips: filteredTips,
    upgradeRequired: tier === 'premium' ? false : undefined,
  });
});

/**
 * 4. GET /v1/results?since={epochSec}
 */
app.get('/v1/results', (req: Request, res: Response) => {
  const sinceRaw = req.query.since as string;
  let since = 0;

  if (sinceRaw !== undefined) {
    const parsed = parseInt(sinceRaw, 10);
    if (isNaN(parsed) || parsed < 0) {
      return res.status(400).json({
        error: 'Invalid since parameter. Expected non-negative epoch seconds.',
      });
    }
    since = parsed;
  }

  const results = settlementResults
    .filter((r) => r.settledAt >= since)
    .map((r) => ({
      predictionId: r.predictionId,
      status: r.status,
      homeGoals: r.homeGoals,
      awayGoals: r.awayGoals,
      settledAt: r.settledAt,
    }));

  res.status(200).json({
    source: 'settler-v1',
    results,
  });
});

/**
 * 5. GET /v1/clubs & GET /v1/clubs/:id (Phase 2)
 */
app.get('/v1/clubs', (req: Request, res: Response) => {
  res.status(200).json({
    source: 'igoal-clubs-v1',
    clubs,
  });
});

app.get('/v1/clubs/:id', (req: Request, res: Response) => {
  const club = clubs.find((c) => c.id === req.params.id);
  if (!club) {
    return res.status(404).json({ error: `Club with ID '${req.params.id}' not found.` });
  }
  res.status(200).json(club);
});

/**
 * 6. GET /v1/me (Phase 3 User Profile & Entitlements)
 */
app.get('/v1/me', (req: Request, res: Response) => {
  const user = authenticateUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please pass Bearer token.' });
  }
  const isVip = user.role === 'admin' || (user.tier === 'vip' && (!user.vipExpiresAt || user.vipExpiresAt > Date.now() / 1000));
  res.status(200).json({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    tier: user.tier,
    expiresAt: user.vipExpiresAt,
    isVip,
  });
});

// ------------------------------------------------------------------------------
// PROTECTED ADMIN API ENDPOINTS (/v1/admin/*)
// ------------------------------------------------------------------------------

/**
 * POST /v1/admin/fixtures (Phase 1)
 */
app.post('/v1/admin/fixtures', requireAdminAuth, (req: Request, res: Response) => {
  const { league, country, home, away, kickoff, status: fxStatus, homeGoals, awayGoals, minute, homeClubId, awayClubId } = req.body;

  if (!league || !country || !home || !away || !kickoff) {
    return res.status(400).json({ error: 'Missing required fixture fields: league, country, home, away, kickoff.' });
  }

  const id = req.body.id || `fx_${Date.now()}_${home.substring(0, 3).toLowerCase()}_${away.substring(0, 3).toLowerCase()}`;

  // Auto-resolve club IDs and logos
  const hClub = clubs.find((c) => c.id === homeClubId || c.name.toLowerCase().includes(home.toLowerCase()) || home.toLowerCase().includes(c.shortName.toLowerCase()));
  const aClub = clubs.find((c) => c.id === awayClubId || c.name.toLowerCase().includes(away.toLowerCase()) || away.toLowerCase().includes(c.shortName.toLowerCase()));

  const newFixture: FixtureRecord = {
    id,
    league,
    country,
    home,
    away,
    kickoff: parseInt(kickoff, 10),
    status: fxStatus || 'SCHEDULED',
    homeGoals: fxStatus === 'SCHEDULED' ? null : (homeGoals !== undefined ? homeGoals : null),
    awayGoals: fxStatus === 'SCHEDULED' ? null : (awayGoals !== undefined ? awayGoals : null),
    minute: fxStatus === 'LIVE' ? (minute || 1) : null,
    homeClubId: hClub ? hClub.id : (homeClubId || null),
    awayClubId: aClub ? aClub.id : (awayClubId || null),
    homeLogoUrl: hClub ? hClub.logoUrl : null,
    awayLogoUrl: aClub ? aClub.logoUrl : null,
    deletedAt: null,
  };

  fixtures.push(newFixture);
  logAudit((req as any).user.uid, 'FIXTURE_CREATE', 'fixture', id, { home, away, league, status: newFixture.status });

  res.status(201).json(newFixture);
});

/**
 * PATCH /v1/admin/fixtures/:id (Phase 1)
 */
app.patch('/v1/admin/fixtures/:id', requireAdminAuth, (req: Request, res: Response) => {
  const target = fixtures.find((f) => f.id === req.params.id);
  if (!target) {
    return res.status(404).json({ error: `Fixture '${req.params.id}' not found.` });
  }

  const updates = req.body;
  if (updates.status !== undefined) target.status = updates.status;
  if (updates.homeGoals !== undefined) target.homeGoals = updates.homeGoals;
  if (updates.awayGoals !== undefined) target.awayGoals = updates.awayGoals;
  if (updates.minute !== undefined) target.minute = updates.minute;
  if (updates.kickoff !== undefined) target.kickoff = updates.kickoff;
  if (updates.home !== undefined) target.home = updates.home;
  if (updates.away !== undefined) target.away = updates.away;
  if (updates.league !== undefined) target.league = updates.league;
  if (updates.country !== undefined) target.country = updates.country;
  if (updates.homeLogoUrl !== undefined) target.homeLogoUrl = updates.homeLogoUrl;
  if (updates.awayLogoUrl !== undefined) target.awayLogoUrl = updates.awayLogoUrl;

  logAudit((req as any).user.uid, 'FIXTURE_UPDATE', 'fixture', target.id, updates);
  res.status(200).json(target);
});

/**
 * DELETE /v1/admin/fixtures/:id?force=true (Phase 1)
 */
app.delete('/v1/admin/fixtures/:id', requireAdminAuth, (req: Request, res: Response) => {
  const fixtureId = req.params.id;
  const force = req.query.force === 'true';
  const target = fixtures.find((f) => f.id === fixtureId);

  if (!target) {
    return res.status(404).json({ error: `Fixture '${fixtureId}' not found.` });
  }

  // Check if any tips linked to this fixture have already been settled
  const linkedTips = tips.filter((t) => t.fixtureId === fixtureId);
  const settledIds = new Set(settlementResults.map((s) => s.predictionId));
  const settledCount = linkedTips.filter((t) => settledIds.has(t.id)).length;

  if (settledCount > 0 && !force) {
    return res.status(400).json({
      error: `Cannot delete fixture: ${settledCount} prediction tips have already been settled. Pass ?force=true to override with audit log.`,
    });
  }

  const nowSec = Math.floor(Date.now() / 1000);
  target.deletedAt = nowSec;

  logAudit((req as any).user.uid, 'FIXTURE_DELETE', 'fixture', fixtureId, { force, settledTipsCount: settledCount, softDeletedAt: nowSec });

  res.status(200).json({
    ok: true,
    fixtureId,
    softDeleted: true,
    deletedAt: nowSec,
  });
});

/**
 * GET /v1/admin/fixtures (Phase 1)
 */
app.get('/v1/admin/fixtures', requireAdminAuth, (req: Request, res: Response) => {
  const fromEpoch = req.query.from ? parseInt(req.query.from as string, 10) : null;
  const toEpoch = req.query.to ? parseInt(req.query.to as string, 10) : null;
  const statusFilter = req.query.status as string;
  const includeDeleted = req.query.includeDeleted === 'true';

  let result = fixtures;
  if (!includeDeleted) {
    result = result.filter((f) => f.deletedAt === null);
  }
  if (fromEpoch) {
    result = result.filter((f) => f.kickoff >= fromEpoch);
  }
  if (toEpoch) {
    result = result.filter((f) => f.kickoff <= toEpoch);
  }
  if (statusFilter) {
    result = result.filter((f) => f.status === statusFilter);
  }

  res.status(200).json(result);
});

/**
 * POST /v1/admin/tips (Manual tip publish)
 */
app.post('/v1/admin/tips', requireAdminAuth, (req: Request, res: Response) => {
  const { fixtureId, market, selection, confidence, risk, explanation, tier } = req.body;
  const fx = fixtures.find((f) => f.id === fixtureId && f.deletedAt === null);
  if (!fx) {
    return res.status(404).json({ error: `Active fixture '${fixtureId}' not found.` });
  }

  const id = req.body.id || `tip_${Date.now()}_${fixtureId.replace('fx_', '')}`;
  const newTip: TipRecord = {
    id,
    fixtureId,
    league: fx.league,
    home: fx.home,
    away: fx.away,
    kickoff: fx.kickoff,
    market,
    selection,
    confidence: parseInt(confidence, 10),
    risk,
    explanation,
    publishedAt: Math.floor(Date.now() / 1000),
    modelVersion: 'admin-manual-1.0',
    tier: tier || 'free',
    homeLogoUrl: fx.homeLogoUrl,
    awayLogoUrl: fx.awayLogoUrl,
  };

  tips.push(newTip);
  logAudit((req as any).user.uid, 'TIP_PUBLISH', 'tip', id, { market, selection, tier: newTip.tier });

  res.status(201).json(newTip);
});

/**
 * DELETE /v1/admin/tips/:id (Only if NOT settled)
 */
app.delete('/v1/admin/tips/:id', requireAdminAuth, (req: Request, res: Response) => {
  const tipId = req.params.id;
  const tipIndex = tips.findIndex((t) => t.id === tipId);
  if (tipIndex === -1) {
    return res.status(404).json({ error: `Tip '${tipId}' not found.` });
  }

  const isSettled = settlementResults.some((s) => s.predictionId === tipId);
  if (isSettled) {
    return res.status(400).json({ error: `Tip '${tipId}' has already been settled and is strictly immutable.` });
  }

  tips.splice(tipIndex, 1);
  logAudit((req as any).user.uid, 'TIP_DELETE', 'tip', tipId);

  res.status(200).json({ ok: true, tipId, deleted: true });
});

/**
 * POST /v1/admin/settlements (Force settle)
 */
app.post('/v1/admin/settlements', requireAdminAuth, (req: Request, res: Response) => {
  const { predictionId, status: outcomeStatus, homeGoals, awayGoals } = req.body;
  const tip = tips.find((t) => t.id === predictionId);
  if (!tip) {
    return res.status(404).json({ error: `Tip '${predictionId}' not found.` });
  }

  const existingIdx = settlementResults.findIndex((s) => s.predictionId === predictionId);
  const settledRecord: SettlementRecord = {
    predictionId,
    status: outcomeStatus,
    homeGoals: parseInt(homeGoals, 10) || 0,
    awayGoals: parseInt(awayGoals, 10) || 0,
    settledAt: Math.floor(Date.now() / 1000),
  };

  if (existingIdx >= 0) {
    settlementResults[existingIdx] = settledRecord;
  } else {
    settlementResults.push(settledRecord);
  }

  logAudit((req as any).user.uid, 'FORCE_SETTLE', 'settlement', predictionId, { status: outcomeStatus, score: `${homeGoals}-${awayGoals}` });
  res.status(200).json(settledRecord);
});

/**
 * POST /v1/admin/clubs/:id/logo (Phase 2 Logo Upload)
 */
app.post('/v1/admin/clubs/:id/logo', requireAdminAuth, (req: Request, res: Response) => {
  const clubId = req.params.id;
  const club = clubs.find((c) => c.id === clubId);
  if (!club) {
    return res.status(404).json({ error: `Club '${clubId}' not found.` });
  }

  const { logoUrl } = req.body;
  const storagePath = `clubs/${clubId}/logo.png`;
  const finalLogoUrl = logoUrl || `${FIREBASE_STORAGE_BASE_URL}/${storagePath}`;

  club.logoPath = storagePath;
  club.logoUrl = finalLogoUrl;
  club.updatedAt = Math.floor(Date.now() / 1000);

  // Refresh denormalized logo URLs on fixtures
  fixtures.forEach((f) => {
    if (f.homeClubId === clubId) f.homeLogoUrl = finalLogoUrl;
    if (f.awayClubId === clubId) f.awayLogoUrl = finalLogoUrl;
  });

  // Refresh tips
  tips.forEach((t) => {
    const fx = fixtures.find((f) => f.id === t.fixtureId);
    if (fx) {
      t.homeLogoUrl = fx.homeLogoUrl;
      t.awayLogoUrl = fx.awayLogoUrl;
    }
  });

  logAudit((req as any).user.uid, 'LOGO_UPLOAD', 'club', clubId, { storagePath, logoUrl: finalLogoUrl });
  res.status(200).json(club);
});

/**
 * POST /v1/admin/users/entitlement (Phase 3 VIP Entitlements)
 */
app.post('/v1/admin/users/entitlement', requireAdminAuth, (req: Request, res: Response) => {
  const { uid, tier, days } = req.body;
  let targetUser = users.find((u) => u.uid === uid);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = tier === 'vip' ? now + (days || 30) * 86400 : null;

  if (!targetUser) {
    targetUser = {
      uid,
      email: `${uid}@example.com`,
      displayName: `User ${uid.substring(0, 6)}`,
      role: 'user',
      tier: tier || 'vip',
      vipExpiresAt: expiresAt,
      createdAt: now,
      updatedAt: now,
    };
    users.push(targetUser);
  } else {
    targetUser.tier = tier || 'vip';
    targetUser.vipExpiresAt = expiresAt;
    targetUser.updatedAt = now;
  }

  logAudit((req as any).user.uid, 'VIP_GRANT', 'user', uid, { tier: targetUser.tier, expiresAt });
  res.status(200).json(targetUser);
});

/**
 * GET /v1/admin/audit (Phase 1)
 */
app.get('/v1/admin/audit', requireAdminAuth, (req: Request, res: Response) => {
  res.status(200).json({
    source: 'igoal-audit-v1',
    logs: auditLogs,
  });
});

/**
 * POST /v1/admin/notifications/broadcast (Phase 4)
 */
app.post('/v1/admin/notifications/broadcast', requireAdminAuth, (req: Request, res: Response) => {
  const { channel, title, body, fixtureId } = req.body;
  logAudit((req as any).user.uid, 'NOTIFICATION_BROADCAST', 'notification', channel, { title, body, fixtureId });
  res.status(200).json({
    ok: true,
    channel,
    title,
    delivered: true,
    timestamp: Math.floor(Date.now() / 1000),
  });
});

// ------------------------------------------------------------------------------
// Console State & Simulation Routes
// ------------------------------------------------------------------------------
app.get('/api/admin/state', (req: Request, res: Response) => {
  res.json({
    fixtures,
    tips,
    settlementResults,
    clubs,
    users,
    auditLogs,
    adminToken: ADMIN_TOKEN,
    stats: {
      totalFixtures: fixtures.filter((f) => f.deletedAt === null).length,
      scheduled: fixtures.filter((f) => f.deletedAt === null && f.status === 'SCHEDULED').length,
      live: fixtures.filter((f) => f.deletedAt === null && f.status === 'LIVE').length,
      finished: fixtures.filter((f) => f.deletedAt === null && f.status === 'FINISHED').length,
      postponed: fixtures.filter((f) => f.deletedAt === null && f.status === 'POSTPONED').length,
      softDeleted: fixtures.filter((f) => f.deletedAt !== null).length,
      totalTips: tips.length,
      freeTips: tips.filter((t) => t.tier === 'free').length,
      premiumTips: tips.filter((t) => t.tier === 'premium').length,
      settledResults: settlementResults.length,
      wonCount: settlementResults.filter((s) => s.status === 'WON').length,
      lostCount: settlementResults.filter((s) => s.status === 'LOST').length,
      clubsCount: clubs.length,
      usersCount: users.length,
      vipUsersCount: users.filter((u) => u.tier === 'vip').length,
    },
  });
});

// Trigger Prediction Engine Worker
app.post('/api/admin/engine/run', (req: Request, res: Response) => {
  const existingFixtureIds = new Set(tips.map((t) => t.fixtureId));
  const activeUnpredicted = fixtures.filter((f) => f.deletedAt === null && !existingFixtureIds.has(f.id));

  let createdCount = 0;
  for (const fx of activeUnpredicted) {
    const tipId = `tip_${Date.now()}_${fx.id.replace('fx_', '')}`;
    const newTip: TipRecord = {
      id: tipId,
      fixtureId: fx.id,
      league: fx.league,
      home: fx.home,
      away: fx.away,
      kickoff: fx.kickoff,
      market: 'Match Winner (1X2)',
      selection: 'Home win',
      confidence: 68,
      risk: 'MEDIUM',
      explanation: `Poisson bivariate matrix lean home; models agree within 7 points.`,
      publishedAt: Math.floor(Date.now() / 1000),
      modelVersion: 'poisson-emp-1.0',
      tier: createdCount % 2 === 0 ? 'free' : 'premium',
      homeLogoUrl: fx.homeLogoUrl,
      awayLogoUrl: fx.awayLogoUrl,
    };
    tips.push(newTip);
    createdCount++;
  }

  logAudit('admin_master', 'ENGINE_RUN', 'worker', 'poisson_engine', { generated: createdCount });
  res.json({ ok: true, created: createdCount, totalTips: tips.length });
});

// Trigger Settlement Worker
app.post('/api/admin/settler/run', (req: Request, res: Response) => {
  const settledIds = new Set(settlementResults.map((s) => s.predictionId));
  const unsettled = tips.filter((t) => !settledIds.has(t.id));

  let settledCount = 0;
  for (const tip of unsettled) {
    const fx = fixtures.find((f) => f.id === tip.fixtureId);
    if (!fx || (fx.status !== 'FINISHED' && fx.status !== 'POSTPONED')) continue;

    let outcome: 'WON' | 'LOST' | 'VOID' | 'POSTPONED' = 'VOID';
    if (fx.status === 'POSTPONED') outcome = 'POSTPONED';
    else if (fx.homeGoals !== null && fx.awayGoals !== null) {
      if (tip.selection.includes('Home')) outcome = fx.homeGoals > fx.awayGoals ? 'WON' : 'LOST';
      else if (tip.selection.includes('Over 2.5')) outcome = fx.homeGoals + fx.awayGoals > 2 ? 'WON' : 'LOST';
      else outcome = 'WON';
    }

    settlementResults.push({
      predictionId: tip.id,
      status: outcome,
      homeGoals: fx.homeGoals || 0,
      awayGoals: fx.awayGoals || 0,
      settledAt: Math.floor(Date.now() / 1000),
    });
    settledCount++;
  }

  logAudit('admin_master', 'SETTLER_RUN', 'worker', 'settler', { evaluated: settledCount });
  res.json({ ok: true, settled: settledCount, totalSettled: settlementResults.length });
});

// ------------------------------------------------------------------------------
// Vite Dev Server Middleware or Static Production Build
// ------------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[iGoal Backend v2] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[iGoal Backend] Failed to start server:', err);
});
