import React, { useState, useEffect } from 'react';
import {
  Server,
  Activity,
  Calendar,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  RotateCcw,
  Code2,
  FileText,
  ShieldAlert,
  Send,
  Database,
  Terminal,
  Zap,
  Check,
  Copy,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  Shield,
  Crown,
  User,
  Image,
  UploadCloud,
  Bell,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Lock,
  Unlock,
  Wand2,
  Target,
  Percent,
  Sliders,
  LayoutGrid,
  List,
  Globe,
  Info
} from 'lucide-react';
import { MAJOR_CLUBS, dictateClub, dictateFixtureLogos, ClubInfo, DictationResult } from './data/clubsData';

interface Club {
  id: string;
  name: string;
  shortName: string;
  country: string;
  logoPath: string | null;
  logoUrl: string | null;
  updatedAt: number;
}

interface Fixture {
  id: string;
  league: string;
  country: string;
  home: string;
  away: string;
  kickoff: number;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';
  homeGoals: number | null;
  awayGoals: number | null;
  minute: number | null;
  homeClubId?: string | null;
  awayClubId?: string | null;
  homeLogoUrl?: string | null;
  awayLogoUrl?: string | null;
  deletedAt?: number | null;
}

interface Tip {
  id: string;
  fixtureId: string;
  league: string;
  home: string;
  away: string;
  kickoff: number;
  market: string;
  selection: string;
  confidence: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  explanation: string;
  publishedAt: number;
  modelVersion: string;
  tier: 'free' | 'premium';
  homeLogoUrl?: string | null;
  awayLogoUrl?: string | null;
}

interface SettlementResult {
  predictionId: string;
  status: 'WON' | 'LOST' | 'VOID' | 'POSTPONED';
  homeGoals: number;
  awayGoals: number;
  settledAt: number;
}

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'user' | 'admin';
  tier: 'free' | 'vip';
  vipExpiresAt: number | null;
  createdAt: number;
}

interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string | null;
  createdAt: number;
}

interface SystemStats {
  totalFixtures: number;
  scheduled: number;
  live: number;
  finished: number;
  postponed: number;
  softDeleted: number;
  totalTips: number;
  freeTips: number;
  premiumTips: number;
  settledResults: number;
  wonCount: number;
  lostCount: number;
  clubsCount: number;
  usersCount: number;
  vipUsersCount: number;
}

// Market options and selection presets for posting predictions
const MARKET_OPTIONS = [
  {
    market: 'Match Winner (1X2)',
    presets: ['Home win', 'Draw', 'Away win'],
  },
  {
    market: 'Over/Under 2.5 Goals',
    presets: ['Over 2.5', 'Under 2.5'],
  },
  {
    market: 'Both Teams to Score',
    presets: ['Yes', 'No'],
  },
  {
    market: 'Double Chance',
    presets: ['1X (Home or Draw)', 'X2 (Away or Draw)', '12 (Home or Away)'],
  },
  {
    market: 'Over/Under 1.5 Goals',
    presets: ['Over 1.5', 'Under 1.5'],
  },
  {
    market: 'Draw No Bet',
    presets: ['Home (DNB)', 'Away (DNB)'],
  },
  {
    market: 'Correct Score',
    presets: ['2-1', '1-0', '2-0', '1-1', '3-1', '0-0', '1-2', '0-2'],
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'admin_fixtures' | 'tips_studio' | 'clubs' | 'vip_users' | 'explorer' | 'workers' | 'contracts' | 'tests'>('admin_fixtures');

  // Backend state
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [settlements, setSettlements] = useState<SettlementResult[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [adminToken, setAdminToken] = useState('igoal_admin_secret_2026');
  const [loading, setLoading] = useState(false);

  // Active Session Simulator for Free vs VIP vs Admin
  const [selectedPersona, setSelectedPersona] = useState<'admin' | 'vip' | 'free' | 'guest'>('admin');
  const [currentBearerToken, setCurrentBearerToken] = useState('igoal_admin_secret_2026');

  // API Explorer state
  const [selectedEndpoint, setSelectedEndpoint] = useState<'fixtures' | 'tips' | 'results' | 'clubs' | 'me' | 'health'>('fixtures');
  const [queryDate, setQueryDate] = useState('2026-10-30');
  const [queryTier, setQueryTier] = useState<'free' | 'premium'>('free');
  const [querySince, setQuerySince] = useState('0');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiStatusCode, setApiStatusCode] = useState<number | null>(null);
  const [apiLatencyMs, setApiLatencyMs] = useState<number | null>(null);
  const [apiHeaders, setApiHeaders] = useState<Record<string, string>>({});
  const [isCallingApi, setIsCallingApi] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Search & Filters in Fixtures Table
  const [fixtureSearch, setFixtureSearch] = useState('');
  const [fixtureStatusFilter, setFixtureStatusFilter] = useState<string>('ALL');
  const [showDeletedFixtures, setShowDeletedFixtures] = useState(false);

  // Search & Filters in Tips Studio
  const [tipSearch, setTipSearch] = useState('');
  const [tipTierFilter, setTipTierFilter] = useState<string>('ALL');
  const [tipStatusFilter, setTipStatusFilter] = useState<string>('ALL');

  // Mobile & Responsive View Modes (cards vs table)
  const [fixturesViewMode, setFixturesViewMode] = useState<'cards' | 'table'>('cards');
  const [tipsViewMode, setTipsViewMode] = useState<'cards' | 'table'>('cards');

  // Auto-Dictation Engine & Sandbox State
  const [dictationQuery, setDictationQuery] = useState('Madrid Real');
  const [clubsLeagueFilter, setClubsLeagueFilter] = useState('ALL');
  const [clubsSearch, setClubsSearch] = useState('');
  const [isAutoDictatingAll, setIsAutoDictatingAll] = useState(false);
  const [autoDictateBanner, setAutoDictateBanner] = useState<string | null>(null);

  // Modals state
  const [showCreateFixtureModal, setShowCreateFixtureModal] = useState(false);
  const [newFxHome, setNewFxHome] = useState('');
  const [newFxAway, setNewFxAway] = useState('');
  const [newFxLeague, setNewFxLeague] = useState('Premier League');
  const [newFxCountry, setNewFxCountry] = useState('England');
  const [newFxKickoffHour, setNewFxKickoffHour] = useState(18);
  const [newFxHomeClubId, setNewFxHomeClubId] = useState('');
  const [newFxAwayClubId, setNewFxAwayClubId] = useState('');

  const [editingFixture, setEditingFixture] = useState<Fixture | null>(null);
  const [editStatus, setEditStatus] = useState<Fixture['status']>('FINISHED');
  const [editHomeGoals, setEditHomeGoals] = useState(2);
  const [editAwayGoals, setEditAwayGoals] = useState(1);
  const [editMinute, setEditMinute] = useState(90);

  // POST PREDICTION MODAL STATE (Accommodate Posting Predictions)
  const [showPostTipModal, setShowPostTipModal] = useState(false);
  const [tipFixtureId, setTipFixtureId] = useState('');
  const [tipMarket, setTipMarket] = useState('Match Winner (1X2)');
  const [tipSelection, setTipSelection] = useState('Home win');
  const [tipConfidence, setTipConfidence] = useState(72);
  const [tipRisk, setTipRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [tipTier, setTipTier] = useState<'free' | 'premium'>('free');
  const [tipExplanation, setTipExplanation] = useState('');
  const [tipModelVersion, setTipModelVersion] = useState('expert-analyst-1.0');

  // Force Settlement Modal state
  const [showForceSettleModal, setShowForceSettleModal] = useState(false);
  const [settleTipId, setSettleTipId] = useState('');
  const [settleOutcome, setSettleOutcome] = useState<'WON' | 'LOST' | 'VOID' | 'POSTPONED'>('WON');
  const [settleHomeGoals, setSettleHomeGoals] = useState(2);
  const [settleAwayGoals, setSettleAwayGoals] = useState(1);

  const [clubToEditLogo, setClubToEditLogo] = useState<Club | null>(null);
  const [newLogoUrl, setNewLogoUrl] = useState('');

  const [showGrantVipModal, setShowGrantVipModal] = useState(false);
  const [vipTargetUid, setVipTargetUid] = useState('free_demo_user');
  const [vipGrantDays, setVipGrantDays] = useState(30);

  // Contract test runner state
  const [testResults, setTestResults] = useState<{ name: string; passed: boolean; details: string; phase: string }[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Code inspection tab
  const [codeViewerTab, setCodeViewerTab] = useState<'contract' | 'android_client' | 'android_sync' | 'club_logo_helper' | 'vip_manager' | 'migration' | 'python_admin'>('contract');

  // Persona synchronization
  useEffect(() => {
    switch (selectedPersona) {
      case 'admin':
        setCurrentBearerToken(adminToken);
        break;
      case 'vip':
        setCurrentBearerToken('demo_vip_token');
        break;
      case 'free':
        setCurrentBearerToken('demo_free_token');
        break;
      case 'guest':
        setCurrentBearerToken('');
        break;
    }
  }, [selectedPersona, adminToken]);

  // Fetch full state from server
  const fetchState = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/state');
      if (res.ok) {
        const data = await res.json();
        setFixtures(data.fixtures);
        setTips(data.tips);
        setSettlements(data.settlementResults);
        setClubs(data.clubs);
        setUsers(data.users);
        setAuditLogs(data.auditLogs);
        setStats(data.stats);
        if (data.adminToken) setAdminToken(data.adminToken);
      }
    } catch (err) {
      console.error('Failed to fetch backend state', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Execute Endpoint in Explorer
  const executeEndpoint = async (customEndpoint?: string) => {
    setIsCallingApi(true);
    const start = performance.now();
    let url = '/v1/fixtures?date=' + queryDate;

    if (customEndpoint) {
      url = customEndpoint;
    } else {
      switch (selectedEndpoint) {
        case 'health':
          url = '/v1/health';
          break;
        case 'fixtures':
          url = `/v1/fixtures?date=${encodeURIComponent(queryDate)}`;
          break;
        case 'tips':
          url = `/v1/tips?tier=${encodeURIComponent(queryTier)}`;
          break;
        case 'results':
          url = `/v1/results?since=${encodeURIComponent(querySince)}`;
          break;
        case 'clubs':
          url = '/v1/clubs';
          break;
        case 'me':
          url = '/v1/me';
          break;
      }
    }

    try {
      const headers: Record<string, string> = {
        'X-Device-ID': 'android_pixel_8_pro',
      };
      if (currentBearerToken) {
        headers['Authorization'] = `Bearer ${currentBearerToken}`;
      }

      const res = await fetch(url, { headers });
      const end = performance.now();
      setApiLatencyMs(Math.round(end - start));
      setApiStatusCode(res.status);

      const hdrs: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        if (k.toLowerCase().includes('ratelimit') || k.toLowerCase().includes('retry')) {
          hdrs[k] = v;
        }
      });
      setApiHeaders(hdrs);

      const json = await res.json();
      setApiResponse(json);
    } catch (err: any) {
      setApiStatusCode(500);
      setApiResponse({ error: err.message || 'Network request failed' });
    } finally {
      setIsCallingApi(false);
    }
  };

  // Helper to auto-calculate risk from confidence
  const calculateRiskFromConfidence = (conf: number): 'LOW' | 'MEDIUM' | 'HIGH' => {
    return conf >= 70 ? 'LOW' : conf >= 58 ? 'MEDIUM' : 'HIGH';
  };

  // Auto-Draft Poisson Analysis for chosen fixture and selection
  const handleAutoDraftPoisson = () => {
    const fx = fixtures.find((f) => f.id === tipFixtureId);
    if (!fx) return;

    let hash = 0;
    for (let i = 0; i < fx.home.length; i++) hash = (hash * 31 + fx.home.charCodeAt(i)) & 0xffff;
    const homeAdv = (((hash % 100) - 50) / 100) * 0.6;

    let awayHash = 0;
    for (let i = 0; i < fx.away.length; i++) awayHash = (awayHash * 31 + fx.away.charCodeAt(i)) & 0xffff;
    const awayAdv = (((awayHash % 100) - 50) / 100) * 0.6;

    const lambdaHome = +(1.55 + homeAdv - awayAdv * 0.3).toFixed(2);
    const lambdaAway = +(1.15 + awayAdv - homeAdv * 0.3).toFixed(2);
    const totalGoals = +(lambdaHome + lambdaAway).toFixed(2);

    let conf = 72;
    let exp = `Poisson bivariate analysis projects ${fx.home} (${lambdaHome} xG) vs ${fx.away} (${lambdaAway} xG).`;

    if (tipMarket.includes('1X2') || tipMarket.includes('Winner')) {
      if (tipSelection.includes('Home')) {
        conf = Math.min(88, Math.max(55, Math.round(52 + (lambdaHome - lambdaAway) * 22)));
        exp = `Poisson home lean (xG ${lambdaHome} vs ${lambdaAway}); offensive conversion and defensive records favor ${fx.home}. Empirical models agree within 6 points.`;
      } else if (tipSelection.includes('Away')) {
        conf = Math.min(84, Math.max(52, Math.round(48 + (lambdaAway - lambdaHome) * 22)));
        exp = `Counter-attacking efficiency favors ${fx.away} (xG ${lambdaAway}); expected road conversion differential exceeds baseline.`;
      } else {
        conf = 58;
        exp = `Balanced projected chance creation (${lambdaHome} vs ${lambdaAway}) indicates tight low-margin draw potential.`;
      }
    } else if (tipMarket.includes('2.5') || tipMarket.includes('Goals')) {
      if (tipSelection.includes('Over')) {
        conf = totalGoals > 2.6 ? 76 : 65;
        exp = `Combined expected goals (${totalGoals}) exceed market threshold; open transitional pace favors Over 2.5.`;
      } else {
        conf = totalGoals < 2.5 ? 74 : 63;
        exp = `Combined expected goals (${totalGoals}) sit below line; compact defensive shape favors Under 2.5.`;
      }
    } else if (tipMarket.includes('Both Teams') || tipMarket.includes('BTTS')) {
      conf = 69;
      exp = `Both clubs averaging consistent scoring form; defensive concession rates support BTTS outcome.`;
    }

    setTipConfidence(conf);
    setTipRisk(calculateRiskFromConfidence(conf));
    setTipExplanation(exp);
  };

  // POST PREDICTION (Accommodate Posting Predictions)
  const handlePostPrediction = async () => {
    if (!tipFixtureId) {
      alert('Please select a fixture');
      return;
    }
    if (!tipSelection) {
      alert('Please enter a selection (e.g. Home win, Over 2.5)');
      return;
    }

    try {
      const res = await fetch('/v1/admin/tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          fixtureId: tipFixtureId,
          market: tipMarket,
          selection: tipSelection,
          confidence: tipConfidence,
          risk: tipRisk,
          explanation: tipExplanation || undefined,
          tier: tipTier,
          modelVersion: tipModelVersion,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Failed to post prediction: ${err.error || res.statusText}`);
        return;
      }

      const published = await res.json();
      setShowPostTipModal(false);
      await fetchState();
      alert(`Prediction published successfully!\nTip ID: ${published.id}\nTier: ${published.tier.toUpperCase()}`);
    } catch (err: any) {
      alert(`Error publishing prediction: ${err.message}`);
    }
  };

  // Delete Tip (Only if not settled)
  const handleDeleteTip = async (tipId: string) => {
    if (!confirm('Are you sure you want to delete this prediction? (Settled tips are immutable)')) return;

    try {
      const res = await fetch(`/v1/admin/tips/${tipId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        alert(`Error: ${data.error || 'Failed to delete tip'}`);
        return;
      }

      await fetchState();
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    }
  };

  // Force Settle Tip
  const handleForceSettle = async () => {
    try {
      const res = await fetch('/v1/admin/settlements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          predictionId: settleTipId,
          status: settleOutcome,
          homeGoals: settleHomeGoals,
          awayGoals: settleAwayGoals,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Failed to settle: ${err.error}`);
        return;
      }

      setShowForceSettleModal(false);
      await fetchState();
      alert(`Settlement committed! Prediction marked ${settleOutcome} (${settleHomeGoals}-${settleAwayGoals}).`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Create Fixture (Phase 1)
  const handleCreateFixture = async () => {
    if (!newFxHome || !newFxAway) {
      alert('Please enter Home and Away teams');
      return;
    }

    const kickoffSec = Math.floor(new Date('2026-10-30T00:00:00Z').getTime() / 1000) + newFxKickoffHour * 3600;

    try {
      const res = await fetch('/v1/admin/fixtures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          home: newFxHome,
          away: newFxAway,
          league: newFxLeague,
          country: newFxCountry,
          kickoff: kickoffSec,
          status: 'SCHEDULED',
          homeClubId: newFxHomeClubId || undefined,
          awayClubId: newFxAwayClubId || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Error creating fixture: ${err.error || res.statusText}`);
        return;
      }

      setShowCreateFixtureModal(false);
      setNewFxHome('');
      setNewFxAway('');
      await fetchState();
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    }
  };

  // Auto-dictate all fixtures in batch
  const handleAutoDictateAllFixtures = async () => {
    setIsAutoDictatingAll(true);
    setAutoDictateBanner(null);
    try {
      const res = await fetch('/v1/admin/fixtures/auto-dictate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok) {
        setAutoDictateBanner(data.message || `Auto-dictated and updated ${data.updatedCount} fixture logos!`);
        await fetchState();
      } else {
        alert(data.error || 'Failed to auto-dictate fixtures.');
      }
    } catch (err: any) {
      alert(`Auto-dictate failed: ${err.message}`);
    } finally {
      setIsAutoDictatingAll(false);
      setTimeout(() => setAutoDictateBanner(null), 6000);
    }
  };

  // Update Fixture (Phase 1)
  const handleUpdateFixture = async () => {
    if (!editingFixture) return;
    try {
      const res = await fetch(`/v1/admin/fixtures/${editingFixture.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status: editStatus,
          homeGoals: editStatus === 'SCHEDULED' || editStatus === 'POSTPONED' ? null : editHomeGoals,
          awayGoals: editStatus === 'SCHEDULED' || editStatus === 'POSTPONED' ? null : editAwayGoals,
          minute: editStatus === 'LIVE' ? editMinute : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Error updating fixture: ${err.error}`);
        return;
      }

      setEditingFixture(null);
      await fetchState();
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    }
  };

  // Delete Fixture (Phase 1 soft-delete)
  const handleDeleteFixture = async (fixtureId: string, force: boolean = false) => {
    if (!confirm(force ? 'Force delete this match and ignore settled tips warning?' : 'Are you sure you want to delete this match?')) {
      return;
    }

    try {
      const res = await fetch(`/v1/admin/fixtures/${fixtureId}?force=${force}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 400 && data.error && data.error.includes('pass ?force=true')) {
          if (confirm(`${data.error}\n\nDo you want to FORCE delete this fixture?`)) {
            handleDeleteFixture(fixtureId, true);
            return;
          }
        } else {
          alert(`Error: ${data.error || 'Failed to delete'}`);
        }
        return;
      }

      await fetchState();
    } catch (err: any) {
      alert(`Error deleting fixture: ${err.message}`);
    }
  };

  // Update Club Logo (Phase 2)
  const handleUpdateLogo = async () => {
    if (!clubToEditLogo || !newLogoUrl) return;
    try {
      const res = await fetch(`/v1/admin/clubs/${clubToEditLogo.id}/logo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ logoUrl: newLogoUrl }),
      });

      if (!res.ok) {
        alert('Failed to update logo');
        return;
      }

      setClubToEditLogo(null);
      setNewLogoUrl('');
      await fetchState();
    } catch (err: any) {
      alert(`Error updating club logo: ${err.message}`);
    }
  };

  // Grant VIP Entitlement (Phase 3)
  const handleGrantVip = async () => {
    try {
      const res = await fetch('/v1/admin/users/entitlement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          uid: vipTargetUid,
          tier: 'vip',
          days: vipGrantDays,
        }),
      });

      if (!res.ok) {
        alert('Failed to grant VIP entitlement');
        return;
      }

      setShowGrantVipModal(false);
      await fetchState();
      alert(`Successfully granted VIP to ${vipTargetUid} for ${vipGrantDays} days!`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Run Comprehensive Contract & Verification Suite
  const runFullVerificationSuite = async () => {
    setIsRunningTests(true);
    const results: { name: string; passed: boolean; details: string; phase: string }[] = [];

    // Test 1: Health check
    try {
      const res = await fetch('/v1/health');
      const data = await res.json();
      results.push({
        phase: 'Phase 1',
        name: 'Public Health Check (GET /v1/health)',
        passed: res.status === 200 && data.ok === true && data.version === '2.0.0',
        details: 'Returns ok: true, version: 2.0.0, mode: production',
      });
    } catch {
      results.push({ phase: 'Phase 1', name: 'Public Health Check', passed: false, details: 'Network error' });
    }

    // Test 2: Admin Auth Security Gate
    try {
      const unauth = await fetch('/v1/admin/fixtures');
      const auth = await fetch('/v1/admin/fixtures', { headers: { 'Authorization': `Bearer ${adminToken}` } });
      results.push({
        phase: 'Phase 1',
        name: 'Admin Auth RBAC Protection (/v1/admin/*)',
        passed: unauth.status === 401 && auth.status === 200,
        details: 'Rejects unauthenticated requests with HTTP 401; permits valid Bearer admin token.',
      });
    } catch {
      results.push({ phase: 'Phase 1', name: 'Admin Auth RBAC Protection', passed: false, details: 'Auth check error' });
    }

    // Test 3: Fixture CRUD & Immediate Reflection in GET /v1/fixtures
    try {
      const testId = `fx_test_verify_${Date.now()}`;
      const cRes = await fetch('/v1/admin/fixtures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({
          id: testId,
          home: 'Test Athletic',
          away: 'Test United',
          league: 'Premier League',
          country: 'England',
          kickoff: Math.floor(new Date('2026-10-30T15:00:00Z').getTime() / 1000),
          status: 'SCHEDULED',
        }),
      });

      const pRes = await fetch('/v1/fixtures?date=2026-10-30');
      const pData = await pRes.json();
      const foundInPublic = pData.fixtures.some((f: any) => f.id === testId);

      await fetch(`/v1/admin/fixtures/${testId}?force=true`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` },
      });

      results.push({
        phase: 'Phase 1',
        name: 'Admin Fixture CRUD & Public Propagation',
        passed: cRes.status === 201 && foundInPublic,
        details: 'Match created via POST /v1/admin/fixtures is immediately rendered on public GET /v1/fixtures.',
      });
    } catch (e: any) {
      results.push({ phase: 'Phase 1', name: 'Admin Fixture CRUD', passed: false, details: e.message });
    }

    // Test 4: Accommodate Posting Predictions (POST /v1/admin/tips)
    try {
      const tipFx = fixtures[0]?.id || 'fx_20261030_epl_001';
      const postTipRes = await fetch('/v1/admin/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({
          fixtureId: tipFx,
          market: 'Over/Under 2.5 Goals',
          selection: 'Over 2.5',
          confidence: 79,
          tier: 'premium',
          explanation: 'Automated test suite prediction verification.',
        }),
      });
      const tipData = await postTipRes.json();
      const tipId = tipData.id;

      // Verify on public GET /v1/tips as VIP
      const tipsListRes = await fetch('/v1/tips?tier=premium', {
        headers: { 'Authorization': 'Bearer demo_vip_token' },
      });
      const tipsListData = await tipsListRes.json();
      const foundTip = tipsListData.tips.some((t: any) => t.id === tipId);

      results.push({
        phase: 'Predictions',
        name: 'Accommodate Posting Predictions (POST /v1/admin/tips)',
        passed: postTipRes.status === 201 && foundTip && tipData.risk === 'LOW',
        details: `Published tip '${tipId}' with auto-derived LOW risk (79% confidence) and immediate reflection on GET /v1/tips.`,
      });
    } catch (e: any) {
      results.push({ phase: 'Predictions', name: 'Posting Predictions', passed: false, details: e.message });
    }

    // Test 5: Phase 2 Club Logos & Storage Paths
    try {
      const clubsRes = await fetch('/v1/clubs');
      const clubsData = await clubsRes.json();
      const hasLogos = clubsData.clubs.length > 0 && clubsData.clubs.every((c: any) => c.logoPath && c.logoPath.startsWith('clubs/'));
      results.push({
        phase: 'Phase 2',
        name: 'Club Directory & Firebase Storage Structure',
        passed: clubsRes.status === 200 && hasLogos,
        details: 'All clubs map to clubs/{clubId}/logo.png with public CDN/Storage URLs.',
      });
    } catch {
      results.push({ phase: 'Phase 2', name: 'Club Directory', passed: false, details: 'Clubs fetch error' });
    }

    // Test 6: Phase 3 Free vs VIP User Gating on Premium Tips
    try {
      const freeTipsRes = await fetch('/v1/tips?tier=premium', {
        headers: { 'Authorization': 'Bearer demo_free_token' },
      });
      const freeTipsData = await freeTipsRes.json();
      const isFreeGated = freeTipsData.upgradeRequired === true && freeTipsData.tips.length === 0;

      const vipTipsRes = await fetch('/v1/tips?tier=premium', {
        headers: { 'Authorization': 'Bearer demo_vip_token' },
      });
      const vipTipsData = await vipTipsRes.json();
      const isVipUnlocked = vipTipsData.upgradeRequired === false && vipTipsData.tips.length > 0;

      results.push({
        phase: 'Phase 3',
        name: 'Free vs VIP Gating on GET /v1/tips?tier=premium',
        passed: isFreeGated && isVipUnlocked,
        details: 'Free users receive upgradeRequired: true with locked tips; VIP users receive full premium tips.',
      });
    } catch (e: any) {
      results.push({ phase: 'Phase 3', name: 'Free vs VIP Gating', passed: false, details: e.message });
    }

    setTestResults(results);
    setIsRunningTests(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const formatEpoch = (epochSec: number | null | undefined) => {
    if (!epochSec) return 'None';
    return new Date(epochSec * 1000).toUTCString().replace('GMT', 'UTC');
  };

  // Filtered fixtures
  const filteredFixtures = fixtures.filter((f) => {
    if (!showDeletedFixtures && f.deletedAt !== null) return false;
    if (fixtureStatusFilter !== 'ALL' && f.status !== fixtureStatusFilter) return false;
    if (fixtureSearch) {
      const q = fixtureSearch.toLowerCase();
      return (
        f.home.toLowerCase().includes(q) ||
        f.away.toLowerCase().includes(q) ||
        f.league.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered tips
  const filteredTips = tips.filter((t) => {
    if (tipTierFilter !== 'ALL' && t.tier !== tipTierFilter) return false;
    const isSettled = settlements.some((s) => s.predictionId === t.id);
    if (tipStatusFilter === 'SETTLED' && !isSettled) return false;
    if (tipStatusFilter === 'UNSETTLED' && isSettled) return false;
    if (tipSearch) {
      const q = tipSearch.toLowerCase();
      return (
        t.home.toLowerCase().includes(q) ||
        t.away.toLowerCase().includes(q) ||
        t.market.toLowerCase().includes(q) ||
        t.selection.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Preset selections for current market in Post Modal
  const currentMarketPresets =
    MARKET_OPTIONS.find((m) => m.market === tipMarket)?.presets || ['Home win', 'Away win', 'Draw'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40 px-6 py-3.5 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Shield className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white">iGoal Predictions</h1>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Backend & Admin v2.0
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 rounded border border-slate-700">
                  pkg: com.example.igoalpredictions
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Posting Predictions Accommodation • Match CRUD • Firebase Storage Club Logos • Free vs VIP
              </p>
            </div>
          </div>

          {/* User Persona & Role Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-lg p-1 text-xs">
              <span className="text-slate-400 font-medium px-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Persona:
              </span>
              {[
                { id: 'admin', label: 'Admin (Master)', icon: Shield, color: 'text-amber-400 bg-amber-500/20' },
                { id: 'vip', label: 'VIP User', icon: Crown, color: 'text-purple-300 bg-purple-500/20' },
                { id: 'free', label: 'Free User', icon: User, color: 'text-emerald-300 bg-emerald-500/20' },
                { id: 'guest', label: 'Guest (No Auth)', icon: AlertTriangle, color: 'text-slate-300 bg-slate-800' },
              ].map((p) => {
                const isSelected = selectedPersona === p.id;
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPersona(p.id as any)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all cursor-pointer text-xs font-semibold ${
                      isSelected
                        ? `${p.color} border border-current shadow-sm`
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {p.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                fetchState();
                executeEndpoint();
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Mobile-Friendly Horizontal Scrollable) */}
        <div className="max-w-7xl mx-auto flex overflow-x-auto no-scrollbar gap-1.5 mt-3 border-t border-slate-800/80 pt-2.5 pb-0.5 whitespace-nowrap scroll-smooth">
          {[
            { id: 'admin_fixtures', label: 'Fixtures Schedule', icon: Calendar, badge: stats?.totalFixtures },
            { id: 'tips_studio', label: 'Prediction Studio', icon: Sparkles, badge: stats?.totalTips },
            { id: 'clubs', label: 'Club Logos & Dictation', icon: Image, badge: MAJOR_CLUBS.length },
            { id: 'vip_users', label: 'Free vs VIP Users', icon: Crown, badge: stats?.vipUsersCount ? `${stats.vipUsersCount} VIP` : undefined },
            { id: 'explorer', label: 'REST API Explorer', icon: Terminal },
            { id: 'workers', label: 'Workers & Audit', icon: Zap },
            { id: 'contracts', label: 'Contracts & Android', icon: Code2 },
            { id: 'tests', label: 'Verification Suite', icon: CheckCircle2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 min-h-[36px] ${
                  active
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono shrink-0 ${
                      active ? 'bg-slate-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* Banner Alert for Auto-Dictation Operations */}
        {autoDictateBanner && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-lg shadow-emerald-950/40 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{autoDictateBanner}</span>
            </div>
            <button
              onClick={() => setAutoDictateBanner(null)}
              className="text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5 rounded cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: ADMIN FIXTURES CRUD */}
        {/* ========================================================================= */}
        {activeTab === 'admin_fixtures' && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search fixtures, teams, league..."
                    value={fixtureSearch}
                    onChange={(e) => setFixtureSearch(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-64"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Status:</span>
                  <select
                    value={fixtureStatusFilter}
                    onChange={(e) => setFixtureStatusFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="LIVE">LIVE</option>
                    <option value="FINISHED">FINISHED</option>
                    <option value="POSTPONED">POSTPONED</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer ml-2">
                  <input
                    type="checkbox"
                    checked={showDeletedFixtures}
                    onChange={(e) => setShowDeletedFixtures(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
                  />
                  <span>Show Soft-Deleted ({stats?.softDeleted || 0})</span>
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setFixturesViewMode('cards')}
                    className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                      fixturesViewMode === 'cards'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Mobile Stadium Card View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Cards</span>
                  </button>
                  <button
                    onClick={() => setFixturesViewMode('table')}
                    className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                      fixturesViewMode === 'table'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Detailed Table View"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Table</span>
                  </button>
                </div>

                {/* Auto-Dictate All Logos */}
                <button
                  onClick={handleAutoDictateAllFixtures}
                  disabled={isAutoDictatingAll}
                  className="px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Automatically detect, dictate, and link official club logos for all fixtures even with prefixes or misplaced words"
                >
                  <Wand2 className={`w-3.5 h-3.5 text-indigo-400 ${isAutoDictatingAll ? 'animate-spin' : ''}`} />
                  <span>{isAutoDictatingAll ? 'Dictating...' : 'Auto-Dictate Logos'}</span>
                </button>

                <button
                  onClick={() => {
                    if (fixtures.length > 0) setTipFixtureId(fixtures[0].id);
                    setShowPostTipModal(true);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>Post Prediction</span>
                </button>
                <button
                  onClick={() => setShowCreateFixtureModal(true)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Match</span>
                </button>
              </div>
            </div>

            {/* Fixtures Schedule Container */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    Managed Fixtures Schedule
                  </h3>
                  <p className="text-xs text-slate-400">
                    System automatically normalizes & links club logos even if misplaced or prefixed. Click <strong className="text-emerald-400">"Post Tip"</strong> on any match to publish a prediction!
                  </p>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {filteredFixtures.length} matches
                </div>
              </div>

              {/* CARD VIEW (Default Mobile-Friendly Layout) */}
              {fixturesViewMode === 'cards' && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFixtures.map((fx) => {
                    const isDeleted = fx.deletedAt !== null;
                    const isLive = fx.status === 'LIVE';
                    const isFinished = fx.status === 'FINISHED';
                    const formattedKickoff = new Date(fx.kickoff * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div
                        key={fx.id}
                        className={`rounded-xl border transition-all p-4 flex flex-col justify-between ${
                          isDeleted
                            ? 'bg-red-950/20 border-red-900/40 opacity-60'
                            : isLive
                            ? 'bg-emerald-950/20 border-emerald-500/40 shadow-md shadow-emerald-500/5'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Match Header */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 truncate">
                              <Globe className="w-3 h-3 text-slate-500" />
                              {fx.league}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {formattedKickoff} UTC
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  isLive
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                                    : isFinished
                                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                }`}
                              >
                                {isLive ? `${fx.status} ${fx.minute}'` : fx.status}
                              </span>
                            </div>
                          </div>

                          {/* Stadium Matchup Row */}
                          <div className="grid grid-cols-5 items-center gap-2 py-3 bg-slate-900/50 rounded-lg px-3 border border-slate-800/60 my-2">
                            {/* Home Club */}
                            <div className="col-span-2 flex flex-col items-center text-center">
                              <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1.5 mb-1.5 shadow-inner">
                                {fx.homeLogoUrl ? (
                                  <img src={fx.homeLogoUrl} alt={fx.home} className="w-9 h-9 object-contain" />
                                ) : (
                                  <span className="text-xs font-bold text-slate-400">{fx.home.substring(0, 3).toUpperCase()}</span>
                                )}
                              </div>
                              <span className="text-xs font-bold text-white leading-tight line-clamp-1">{fx.home}</span>
                            </div>

                            {/* Center Score / VS */}
                            <div className="col-span-1 flex flex-col items-center justify-center">
                              {isFinished || isLive ? (
                                <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-sm font-black font-mono text-emerald-400">
                                  {fx.homeGoals ?? 0} - {fx.awayGoals ?? 0}
                                </div>
                              ) : (
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">VS</span>
                              )}
                              <span className="text-[9px] font-mono text-slate-500 mt-1">{fx.id.substring(0, 11)}</span>
                            </div>

                            {/* Away Club */}
                            <div className="col-span-2 flex flex-col items-center text-center">
                              <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1.5 mb-1.5 shadow-inner">
                                {fx.awayLogoUrl ? (
                                  <img src={fx.awayLogoUrl} alt={fx.away} className="w-9 h-9 object-contain" />
                                ) : (
                                  <span className="text-xs font-bold text-slate-400">{fx.away.substring(0, 3).toUpperCase()}</span>
                                )}
                              </div>
                              <span className="text-xs font-bold text-white leading-tight line-clamp-1">{fx.away}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Action Buttons (Mobile-Friendly touch targets) */}
                        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                          <button
                            onClick={() => {
                              setTipFixtureId(fx.id);
                              setTipMarket('Match Winner (1X2)');
                              setTipSelection('Home win');
                              setTipConfidence(72);
                              setTipRisk('LOW');
                              setTipTier('free');
                              setTipExplanation(`Poisson lean home (xG edge); conversion dominance for ${fx.home}.`);
                              setShowPostTipModal(true);
                            }}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-500/20"
                          >
                            <Sparkles className="w-3.5 h-3.5 fill-current" />
                            <span>+ Post Tip</span>
                          </button>

                          <button
                            onClick={() => {
                              setEditingFixture(fx);
                              setEditStatus(fx.status);
                              setEditHomeGoals(fx.homeGoals ?? 2);
                              setEditAwayGoals(fx.awayGoals ?? 1);
                              setEditMinute(fx.minute ?? 75);
                            }}
                            className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            title="Edit fixture score/status"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>

                          {!isDeleted && (
                            <button
                              onClick={() => handleDeleteFixture(fx.id, false)}
                              className="py-1.5 px-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs transition-colors cursor-pointer"
                              title="Delete fixture"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TABLE VIEW (Desktop Detailed View) */}
              {fixturesViewMode === 'table' && (
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
                      <th className="py-2.5 px-4">Fixture ID</th>
                      <th className="py-2.5 px-4">Match & Logos</th>
                      <th className="py-2.5 px-4">Kickoff (UTC)</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Score</th>
                      <th className="py-2.5 px-4">Minute</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredFixtures.map((fx) => {
                      const isDeleted = fx.deletedAt !== null;
                      return (
                        <tr
                          key={fx.id}
                          className={`transition-colors ${
                            isDeleted ? 'bg-red-950/20 opacity-60' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {fx.id}
                            {isDeleted && (
                              <span className="block text-[10px] text-red-400 font-bold">DELETED</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {/* Home Logo */}
                              <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 shrink-0">
                                {fx.homeLogoUrl ? (
                                  <img src={fx.homeLogoUrl} alt={fx.home} className="w-5 h-5 object-contain" />
                                ) : (
                                  <span className="text-[9px] font-bold text-slate-400">
                                    {fx.home.substring(0, 2).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <span className="font-semibold text-white">{fx.home}</span>
                              <span className="text-slate-500 font-mono text-[11px]">vs</span>
                              <span className="font-semibold text-white">{fx.away}</span>
                              {/* Away Logo */}
                              <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 shrink-0">
                                {fx.awayLogoUrl ? (
                                  <img src={fx.awayLogoUrl} alt={fx.away} className="w-5 h-5 object-contain" />
                                ) : (
                                  <span className="text-[9px] font-bold text-slate-400">
                                    {fx.away.substring(0, 2).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {fx.league} • {fx.country}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {formatEpoch(fx.kickoff)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                                fx.status === 'LIVE'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                                  : fx.status === 'FINISHED'
                                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                                  : fx.status === 'POSTPONED'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {fx.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-white">
                            {fx.homeGoals !== null && fx.awayGoals !== null ? (
                              `${fx.homeGoals} - ${fx.awayGoals}`
                            ) : (
                              <span className="text-slate-600 font-normal italic">null (explicit)</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {fx.minute !== null ? `${fx.minute}'` : <span className="text-slate-600">null</span>}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isDeleted && (
                                <button
                                  onClick={() => {
                                    setTipFixtureId(fx.id);
                                    setTipMarket('Match Winner (1X2)');
                                    setTipSelection('Home win');
                                    setTipConfidence(72);
                                    setTipRisk('LOW');
                                    setTipTier('free');
                                    setTipExplanation(`Poisson lean home (xG edge); favorable conversion metrics for ${fx.home}.`);
                                    setShowPostTipModal(true);
                                  }}
                                  className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] flex items-center gap-1 transition-colors cursor-pointer font-medium"
                                  title="Post prediction tip for this match"
                                >
                                  <Sparkles className="w-3 h-3 text-emerald-400" />
                                  Post Tip
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditingFixture(fx);
                                  setEditStatus(fx.status);
                                  setEditHomeGoals(fx.homeGoals ?? 2);
                                  setEditAwayGoals(fx.awayGoals ?? 1);
                                  setEditMinute(fx.minute ?? 75);
                                }}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Edit className="w-3 h-3" />
                                Edit
                              </button>
                              {!isDeleted && (
                                <button
                                  onClick={() => handleDeleteFixture(fx.id, false)}
                                  className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Soft-delete match"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PREDICTION STUDIO & TIPS (Accommodate Posting Predictions) */}
        {/* ========================================================================= */}
        {activeTab === 'tips_studio' && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-slate-400 text-xs font-medium">Published Predictions</div>
                <div className="text-2xl font-bold text-white mt-1">{tips.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">Immutable predictions active</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-slate-400 text-xs font-medium">Free Tier Predictions</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">
                  {tips.filter((t) => t.tier === 'free').length}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Publicly available to all users</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-slate-400 text-xs font-medium">VIP Premium Predictions</div>
                <div className="text-2xl font-bold text-purple-400 mt-1">
                  {tips.filter((t) => t.tier === 'premium').length}
                </div>
                <div className="text-[11px] text-purple-300/80 mt-1">Gated for Gold VIP subscribers</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-slate-400 text-xs font-medium">Settled Outcomes</div>
                <div className="text-2xl font-bold text-blue-400 mt-1">{settlements.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {settlements.filter((s) => s.status === 'WON').length} Won •{' '}
                  {settlements.filter((s) => s.status === 'LOST').length} Lost
                </div>
              </div>
            </div>

            {/* Studio Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search tips, teams, market..."
                    value={tipSearch}
                    onChange={(e) => setTipSearch(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-64"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Tier:</span>
                  <select
                    value={tipTierFilter}
                    onChange={(e) => setTipTierFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    <option value="ALL">All Tiers</option>
                    <option value="free">Free Only</option>
                    <option value="premium">VIP Premium Only</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>Settlement:</span>
                  <select
                    value={tipStatusFilter}
                    onChange={(e) => setTipStatusFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    <option value="ALL">All Outcomes</option>
                    <option value="UNSETTLED">Pending / Unsettled</option>
                    <option value="SETTLED">Settled (WON / LOST)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setTipsViewMode('cards')}
                    className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                      tipsViewMode === 'cards'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Mobile Card View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Cards</span>
                  </button>
                  <button
                    onClick={() => setTipsViewMode('table')}
                    className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                      tipsViewMode === 'table'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Table View"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Table</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (fixtures.length > 0) setTipFixtureId(fixtures[0].id);
                    setShowPostTipModal(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post New Prediction</span>
                </button>
              </div>
            </div>

            {/* Predictions Container */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Published Prediction Records (`tips`)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Predictions are immutable once published. Free tips are public; VIP tips are unlocked only for subscribers.
                  </p>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  {filteredTips.length} predictions
                </div>
              </div>

              {/* CARDS VIEW FOR PREDICTIONS */}
              {tipsViewMode === 'cards' && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTips.map((t) => {
                    const settlement = settlements.find((s) => s.predictionId === t.id);

                    return (
                      <div
                        key={t.id}
                        className={`rounded-xl border transition-all p-4 flex flex-col justify-between ${
                          settlement?.status === 'WON'
                            ? 'bg-emerald-950/20 border-emerald-500/40'
                            : settlement?.status === 'LOST'
                            ? 'bg-red-950/20 border-red-900/40'
                            : t.tier === 'premium'
                            ? 'bg-slate-950 border-purple-500/30'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          {/* Header: League & Tier */}
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="text-[11px] text-slate-400 font-medium truncate flex items-center gap-1.5">
                              <Globe className="w-3 h-3 text-slate-500" />
                              {t.league}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 ${
                                t.tier === 'premium'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {t.tier === 'premium' && <Crown className="w-3 h-3 text-purple-400" />}
                              {t.tier}
                            </span>
                          </div>

                          {/* Teams Header with Logos */}
                          <div className="flex items-center gap-2 mb-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                            <div className="w-6 h-6 rounded bg-slate-950 flex items-center justify-center p-0.5 shrink-0 border border-slate-800">
                              {t.homeLogoUrl ? (
                                <img src={t.homeLogoUrl} alt={t.home} className="w-5 h-5 object-contain" />
                              ) : (
                                <span className="text-[8px] font-bold text-slate-400">{t.home.substring(0, 2)}</span>
                              )}
                            </div>
                            <span className="text-xs font-bold text-white truncate">{t.home}</span>
                            <span className="text-slate-500 text-[10px] font-mono">vs</span>
                            <div className="w-6 h-6 rounded bg-slate-950 flex items-center justify-center p-0.5 shrink-0 border border-slate-800">
                              {t.awayLogoUrl ? (
                                <img src={t.awayLogoUrl} alt={t.away} className="w-5 h-5 object-contain" />
                              ) : (
                                <span className="text-[8px] font-bold text-slate-400">{t.away.substring(0, 2)}</span>
                              )}
                            </div>
                            <span className="text-xs font-bold text-white truncate">{t.away}</span>
                          </div>

                          {/* Market & Pick Highlight */}
                          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 mb-3">
                            <div className="text-[11px] text-slate-400 mb-0.5">{t.market}</div>
                            <div className="text-base font-black text-emerald-400">{t.selection}</div>
                          </div>

                          {/* Confidence & Risk */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-400 text-[11px]">Confidence</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-white">{t.confidence}%</span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    t.risk === 'LOW'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : t.risk === 'MEDIUM'
                                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  }`}
                                >
                                  {t.risk} RISK
                                </span>
                              </div>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${t.confidence}%` }}></div>
                            </div>
                          </div>

                          {/* Explanation */}
                          <p className="text-[11px] text-slate-300 italic line-clamp-2 bg-slate-900/40 p-2 rounded border border-slate-800/60 mb-2">
                            "{t.explanation}"
                          </p>
                        </div>

                        {/* Footer Outcome & Actions */}
                        <div className="mt-2 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <div>
                            {settlement ? (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                                  settlement.status === 'WON'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : settlement.status === 'LOST'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {settlement.status} ({settlement.homeGoals}-{settlement.awayGoals})
                              </span>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">Unsettled</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {!settlement && (
                              <button
                                onClick={() => {
                                  setSettleTipId(t.id);
                                  setShowForceSettleModal(true);
                                }}
                                className="px-2.5 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-medium transition-colors cursor-pointer"
                              >
                                Settle
                              </button>
                            )}
                            {!settlement && (
                              <button
                                onClick={() => handleDeleteTip(t.id)}
                                className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs transition-colors cursor-pointer"
                                title="Delete prediction"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TABLE VIEW */}
              {tipsViewMode === 'table' && (
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
                      <th className="py-2.5 px-4">Tip ID</th>
                      <th className="py-2.5 px-4">Match & Teams</th>
                      <th className="py-2.5 px-4">Market & Selection</th>
                      <th className="py-2.5 px-4">Confidence & Risk</th>
                      <th className="py-2.5 px-4">Tier</th>
                      <th className="py-2.5 px-4">Outcome</th>
                      <th className="py-2.5 px-4">Model & Reason</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredTips.map((t) => {
                      const settlement = settlements.find((s) => s.predictionId === t.id);
                      return (
                        <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono text-emerald-400 font-medium">
                            {t.id}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {t.homeLogoUrl && (
                                <img src={t.homeLogoUrl} alt={t.home} className="w-4 h-4 object-contain" />
                              )}
                              <span className="font-semibold text-white">{t.home}</span>
                              <span className="text-slate-500 font-mono text-[10px]">vs</span>
                              <span className="font-semibold text-white">{t.away}</span>
                              {t.awayLogoUrl && (
                                <img src={t.awayLogoUrl} alt={t.away} className="w-4 h-4 object-contain" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{t.league}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-white text-xs">{t.selection}</div>
                            <div className="text-[11px] text-slate-400">{t.market}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white">{t.confidence}%</span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  t.risk === 'LOW'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : t.risk === 'MEDIUM'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}
                              >
                                {t.risk}
                              </span>
                            </div>
                            <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden mt-1.5">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${t.confidence}%` }}
                              ></div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-max ${
                                t.tier === 'premium'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {t.tier === 'premium' && <Crown className="w-3 h-3 text-purple-400" />}
                              {t.tier}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {settlement ? (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                                  settlement.status === 'WON'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : settlement.status === 'LOST'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {settlement.status} ({settlement.homeGoals}-{settlement.awayGoals})
                              </span>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">Unsettled</span>
                            )}
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="text-slate-300 text-[11px] truncate" title={t.explanation}>
                              {t.explanation}
                            </div>
                            <div className="font-mono text-[10px] text-slate-500 mt-0.5">{t.modelVersion}</div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!settlement && (
                                <button
                                  onClick={() => {
                                    setSettleTipId(t.id);
                                    setShowForceSettleModal(true);
                                  }}
                                  className="px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] transition-colors cursor-pointer"
                                  title="Force Settle prediction"
                                >
                                  Settle
                                </button>
                              )}
                              {!settlement && (
                                <button
                                  onClick={() => handleDeleteTip(t.id)}
                                  className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] transition-colors cursor-pointer"
                                  title="Delete tip"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CLUB LOGOS & AUTO-DICTATION ENGINE */}
        {/* ========================================================================= */}
        {activeTab === 'clubs' && (() => {
          const sandboxResult = dictateClub(dictationQuery);

          const filteredClubsList = MAJOR_CLUBS.filter((c) => {
            if (clubsLeagueFilter !== 'ALL' && c.league !== clubsLeagueFilter) return false;
            if (clubsSearch) {
              const q = clubsSearch.toLowerCase();
              return (
                c.name.toLowerCase().includes(q) ||
                c.shortName.toLowerCase().includes(q) ||
                c.country.toLowerCase().includes(q) ||
                c.league.toLowerCase().includes(q) ||
                c.aliases.some((a) => a.toLowerCase().includes(q))
              );
            }
            return true;
          });

          const leagueOptions = [
            { id: 'ALL', label: `All Clubs (${MAJOR_CLUBS.length})` },
            { id: 'Premier League', label: 'Premier League (20)' },
            { id: 'La Liga', label: 'La Liga (20)' },
            { id: 'Serie A', label: 'Serie A (20)' },
            { id: 'Bundesliga', label: 'Bundesliga (18)' },
            { id: 'Ligue 1', label: 'Ligue 1 (18)' },
            { id: 'Continental & Global', label: 'Global Giants (18)' },
          ];

          return (
            <div className="space-y-6">
              {/* SECTION 1: AUTO-DICTATION SANDBOX */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                        <Wand2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                          Intelligent Auto-Dictation Engine
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                            Fuzzy • Misplaced Words • Prefixes
                          </span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Dictates official high-res CDN club logos automatically even with misplaced names (e.g. <em>Madrid Real</em>), formal prefixes (<em>FC</em>, <em>AFC</em>, <em>1.</em>), or informal nicknames (<em>bvb</em>, <em>Spurs</em>, <em>PSG</em>).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Batch Dictate Button */}
                  <button
                    onClick={handleAutoDictateAllFixtures}
                    disabled={isAutoDictatingAll}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/25 shrink-0"
                  >
                    <Wand2 className={`w-4 h-4 ${isAutoDictatingAll ? 'animate-spin' : ''}`} />
                    <span>{isAutoDictatingAll ? 'Auto-Dictating Fixtures...' : 'Auto-Dictate All Fixtures'}</span>
                  </button>
                </div>

                {/* Live Sandbox Interactive Tester */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-indigo-400" />
                        Type Any Misplaced Name, Prefix, Suffix, or Nickname:
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={dictationQuery}
                          onChange={(e) => setDictationQuery(e.target.value)}
                          placeholder="e.g. Madrid Real, City Manchester, FC Arsenal, bvb, Spurs..."
                          className="w-full bg-slate-950 border border-indigo-500/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 font-medium"
                        />
                        {dictationQuery && (
                          <button
                            onClick={() => setDictationQuery('')}
                            className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300 px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                        Click preset to test tricky variations:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: 'Madrid Real', desc: 'Misplaced words' },
                          { label: 'City Manchester', desc: 'Misplaced words' },
                          { label: 'FC Arsenal', desc: 'Prefix FC' },
                          { label: 'AFC Bournemouth', desc: 'Prefix AFC' },
                          { label: 'bvb', desc: 'Acronym' },
                          { label: 'psg', desc: 'Acronym' },
                          { label: 'Spurs', desc: 'Nickname' },
                          { label: 'Munich Bayern', desc: 'Misplaced words' },
                          { label: 'Saint-Étienne', desc: 'Diacritics & Hyphen' },
                          { label: 'Mönchengladbach', desc: 'Umlauts' },
                          { label: 'Hotspur Tottenham', desc: 'Misplaced' },
                          { label: 'Inter Miami', desc: 'MLS Giant' },
                          { label: 'Al Nassr', desc: 'Saudi League' },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            onClick={() => setDictationQuery(preset.label)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              dictationQuery.toLowerCase() === preset.label.toLowerCase()
                                ? 'bg-indigo-500 text-white font-bold shadow-md shadow-indigo-500/30'
                                : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                            }`}
                          >
                            <span>{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dictation Live Output Badge */}
                  <div className="lg:col-span-5 bg-slate-950/90 border border-indigo-500/30 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-slate-400 font-mono text-[11px]">DICTATION ENGINE OUTPUT</span>
                        {sandboxResult.club ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {sandboxResult.confidence}% CONFIDENCE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            UNRESOLVED
                          </span>
                        )}
                      </div>

                      {sandboxResult.club ? (
                        <div className="flex items-center gap-4 my-2">
                          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-indigo-500/30 flex items-center justify-center p-2 shadow-inner shrink-0">
                            <img
                              src={sandboxResult.club.logoUrl}
                              alt={sandboxResult.club.name}
                              className="w-12 h-12 object-contain"
                            />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-white">{sandboxResult.club.name}</h3>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                {sandboxResult.club.shortName}
                              </span>
                              <span className="text-xs text-indigo-300 font-semibold">{sandboxResult.club.league}</span>
                              <span className="text-xs text-slate-400">• {sandboxResult.club.country}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1 font-mono">
                              FotMob ID: <span className="text-emerald-400">{sandboxResult.club.fotmobId}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 text-center text-slate-500 text-xs">
                          Type a team name or select a preset to see auto-dictation in real-time.
                        </div>
                      )}
                    </div>

                    {sandboxResult.club && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80">
                        <div className="text-[10px] text-slate-400 mb-2">
                          <strong className="text-slate-300">Resolution Logic:</strong> {sandboxResult.matchReason}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => copyToClipboard(sandboxResult.club!.logoUrl, 'sandbox_logo')}
                            className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {copiedText === 'sandbox_logo' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedText === 'sandbox_logo' ? 'Copied Logo URL' : 'Copy CDN Logo URL'}</span>
                          </button>
                          <span className="text-[10px] font-mono text-slate-500 truncate max-w-[180px]">
                            {sandboxResult.club.logoPath}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: MAJOR LEAGUE CLUBS DIRECTORY (110+ CLUBS) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                {/* Directory Header & Filters */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Image className="w-5 h-5 text-emerald-400" />
                      Comprehensive Major League Clubs Directory
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {filteredClubsList.length} of {MAJOR_CLUBS.length} clubs
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      High-resolution transparent CDN club badges covering every major league, loaded with instant fuzzy-lookup and Firebase Storage path mapping.
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full lg:w-72">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search club, country, alias..."
                      value={clubsSearch}
                      onChange={(e) => setClubsSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* League Filter Horizontal Tabs */}
                <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-4 mb-4 border-b border-slate-800/80 whitespace-nowrap scroll-smooth">
                  {leagueOptions.map((opt) => {
                    const isSelected = clubsLeagueFilter === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setClubsLeagueFilter(opt.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                            : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {/* Responsive Mobile-Friendly Clubs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {filteredClubsList.map((c) => (
                    <div
                      key={c.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col justify-between hover:border-slate-700 hover:shadow-lg transition-all group"
                    >
                      <div>
                        {/* Club Logo Badge */}
                        <div className="w-full aspect-square max-h-24 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center p-2 mb-2 shadow-inner group-hover:scale-105 transition-transform">
                          <img
                            src={c.logoUrl}
                            alt={c.name}
                            className="max-h-16 max-w-full object-contain"
                            loading="lazy"
                          />
                        </div>

                        {/* Club Info */}
                        <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">
                          {c.name}
                        </h4>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-300">{c.shortName}</span>
                          <span className="font-mono text-slate-500">#{c.fotmobId}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {c.league} • {c.country}
                        </div>
                      </div>

                      {/* Card Action */}
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                        <button
                          onClick={() => copyToClipboard(c.logoUrl, `copy_${c.id}`)}
                          className="flex-1 py-1 px-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Copy direct logo CDN URL"
                        >
                          {copiedText === `copy_${c.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                          <span>{copiedText === `copy_${c.id}` ? 'Copied' : 'Logo URL'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setDictationQuery(c.shortName);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] transition-colors cursor-pointer shrink-0"
                          title="Test in Auto-Dictation Sandbox"
                        >
                          <Wand2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* TAB 4: USERS & VIP ENTITLEMENTS */}
        {/* ========================================================================= */}
        {activeTab === 'vip_users' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg col-span-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-purple-400" />
                  Free vs VIP User Entitlement Model
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The iGoal Android client identifies users via Firebase Auth ID tokens sent as{' '}
                  <code className="text-purple-300 font-mono">Authorization: Bearer &lt;ID_TOKEN&gt;</code>.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase">
                        Free Tier
                      </span>
                      <span className="text-xs text-slate-500">Default Access</span>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                      <li>Full access to <code className="text-emerald-400">GET /v1/fixtures</code></li>
                      <li>Public access to <code className="text-emerald-400">GET /v1/tips?tier=free</code></li>
                      <li>
                        Calls to <code className="text-emerald-400">GET /v1/tips?tier=premium</code> return{' '}
                        <code className="text-amber-300">upgradeRequired: true</code> (empty tips)
                      </li>
                      <li>Receives general match reminder notifications</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/30 text-purple-300 border border-purple-500/50 uppercase">
                        VIP Subscriber
                      </span>
                      <span className="text-xs text-purple-300 font-mono">Gold Status</span>
                    </div>
                    <ul className="text-xs text-purple-200 space-y-1.5 list-disc list-inside">
                      <li>Full access to high-confidence Poisson predictions</li>
                      <li>
                        Calls to <code className="text-purple-300">GET /v1/tips?tier=premium</code> unlock all picks!
                      </li>
                      <li>Verified with server-side <code className="text-purple-300">vipExpiresAt</code> epoch</li>
                      <li>Google Play Billing auto-renewal webhook integration</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Admin Entitlement Control
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Grant or extend VIP subscription passes for user accounts. Used by Google Play developer webhooks or manual customer support.
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setShowGrantVipModal(true)}
                    className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-600/20"
                  >
                    <Crown className="w-4 h-4" />
                    Grant / Extend VIP Subscription
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  Active Users & Subscription Records
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
                      <th className="py-2.5 px-4">UID</th>
                      <th className="py-2.5 px-4">Display Name & Email</th>
                      <th className="py-2.5 px-4">Role</th>
                      <th className="py-2.5 px-4">Tier Status</th>
                      <th className="py-2.5 px-4">VIP Expiration (UTC)</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {users.map((u) => {
                      const isVip = u.tier === 'vip' || u.role === 'admin';
                      return (
                        <tr key={u.uid} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-400">{u.uid}</td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{u.displayName}</div>
                            <div className="text-[11px] text-slate-400">{u.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                u.role === 'admin'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 w-max ${
                                isVip
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {isVip && <Crown className="w-3 h-3 text-purple-400" />}
                              {u.tier}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {formatEpoch(u.vipExpiresAt)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setVipTargetUid(u.uid);
                                setShowGrantVipModal(true);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] transition-colors cursor-pointer"
                            >
                              Set VIP
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: LIVE REST API EXPLORER */}
        {/* ========================================================================= */}
        {activeTab === 'explorer' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-emerald-400" />
                    Live REST Endpoint Explorer
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Currently invoking as:{' '}
                    <span className="text-emerald-400 font-bold uppercase">{selectedPersona}</span> (
                    <code className="text-slate-300 font-mono text-[11px]">
                      {currentBearerToken ? `Bearer ${currentBearerToken.substring(0, 16)}...` : 'No Bearer'}
                    </code>
                    )
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => executeEndpoint()}
                    disabled={isCallingApi}
                    className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isCallingApi ? 'Executing...' : 'Send Request'}
                  </button>
                </div>
              </div>

              {/* Endpoint Selector Grid */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-5">
                {[
                  { id: 'fixtures', path: '/v1/fixtures', method: 'GET', desc: 'Schedule & club logos' },
                  { id: 'tips', path: '/v1/tips', method: 'GET', desc: 'Poisson tips (VIP gated)' },
                  { id: 'results', path: '/v1/results', method: 'GET', desc: 'Settlement outcomes' },
                  { id: 'clubs', path: '/v1/clubs', method: 'GET', desc: 'Club logo directory' },
                  { id: 'me', path: '/v1/me', method: 'GET', desc: 'User profile & tier' },
                  { id: 'health', path: '/v1/health', method: 'GET', desc: 'Readiness check' },
                ].map((ep) => {
                  const isSel = selectedEndpoint === ep.id;
                  return (
                    <button
                      key={ep.id}
                      onClick={() => {
                        setSelectedEndpoint(ep.id as any);
                        setTimeout(() => executeEndpoint(), 50);
                      }}
                      className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isSel
                          ? 'bg-slate-800 border-emerald-500/60 ring-1 ring-emerald-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="px-1 py-0.2 rounded text-[9px] font-black bg-blue-500/20 text-blue-400">
                          {ep.method}
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-white truncate">{ep.path}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{ep.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Parameter Bar */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-wrap items-center gap-4 text-xs font-mono">
                <span className="text-slate-400 font-sans font-medium text-xs">Query Parameters:</span>

                {selectedEndpoint === 'fixtures' && (
                  <div className="flex items-center gap-2">
                    <label className="text-slate-300">date:</label>
                    <input
                      type="text"
                      value={queryDate}
                      onChange={(e) => setQueryDate(e.target.value)}
                      placeholder="YYYY-MM-DD"
                      className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                    <button onClick={() => setQueryDate('2026-10-30')} className="text-[10px] text-emerald-400 hover:underline">
                      (Today)
                    </button>
                  </div>
                )}

                {selectedEndpoint === 'tips' && (
                  <div className="flex items-center gap-2">
                    <label className="text-slate-300">tier:</label>
                    <select
                      value={queryTier}
                      onChange={(e) => setQueryTier(e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="free">free (public)</option>
                      <option value="premium">premium (VIP required)</option>
                    </select>
                    {queryTier === 'premium' && (
                      <span className="text-[11px] font-sans text-purple-300 flex items-center gap-1">
                        <Crown className="w-3 h-3 text-purple-400" />
                        VIP check active
                      </span>
                    )}
                  </div>
                )}

                {selectedEndpoint === 'results' && (
                  <div className="flex items-center gap-2">
                    <label className="text-slate-300">since:</label>
                    <input
                      type="number"
                      value={querySince}
                      onChange={(e) => setQuerySince(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 focus:outline-none focus:border-emerald-500 w-32"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Response Console Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-300">
                    HTTP Response Inspector
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  {apiStatusCode !== null && (
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold ${
                        apiStatusCode >= 200 && apiStatusCode < 300
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : apiStatusCode === 429
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                          : 'bg-red-500/20 text-red-400 border border-red-500/40'
                      }`}
                    >
                      Status: {apiStatusCode}
                    </span>
                  )}

                  {apiLatencyMs !== null && (
                    <span className="text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {apiLatencyMs} ms
                    </span>
                  )}

                  {apiResponse && (
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(apiResponse, null, 2), 'response')}
                      className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedText === 'response' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedText === 'response' ? 'Copied' : 'Copy JSON'}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-950 font-mono text-xs overflow-x-auto max-h-[480px]">
                {apiResponse ? (
                  <pre className="text-emerald-400 leading-relaxed">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                ) : (
                  <div className="text-slate-600 py-12 text-center font-sans">
                    Click <span className="text-emerald-400 font-semibold">"Send Request"</span> to inspect response.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: WORKERS & AUDIT LOGS */}
        {/* ========================================================================= */}
        {activeTab === 'workers' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prediction Engine Worker */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      source: igoal-engine-v1
                    </span>
                    <span className="text-xs text-slate-400 font-mono">model: poisson-emp-1.0</span>
                  </div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Poisson & Empirical Prediction Engine
                  </h3>
                  <div className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Scans unpredicted active fixtures, computes bivariate score probabilities across 0-5 goal grids, and assigns free/premium tiers with low/medium/high risk.
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Published Tips: {tips.length}</span>
                  <button
                    onClick={async () => {
                      const res = await fetch('/api/admin/engine/run', { method: 'POST' });
                      const d = await res.json();
                      await fetchState();
                      alert(`Generated ${d.created} tips!`);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Run Engine Worker
                  </button>
                </div>
              </div>

              {/* Settlement Worker */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/40">
                      source: settler-v1
                    </span>
                    <span className="text-xs text-slate-400 font-mono">auto-reconcile</span>
                  </div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    Automated Match Settlement Worker
                  </h3>
                  <div className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Evaluates finished matches against published predictions:
                    <ul className="list-disc list-inside mt-2 space-y-1 text-slate-300 text-xs">
                      <li>Match Winner (1X2): Won if selection matches actual score</li>
                      <li>Over/Under: Won if goal sum exceeds threshold</li>
                      <li>Postponed: Returns POSTPONED outcome</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Settled Tips: {settlements.length}</span>
                  <button
                    onClick={async () => {
                      const res = await fetch('/api/admin/settler/run', { method: 'POST' });
                      const d = await res.json();
                      await fetchState();
                      alert(`Settled ${d.settled} completed predictions!`);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/10"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Run Settlement Worker
                  </button>
                </div>
              </div>
            </div>

            {/* Audit Log Stream */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Administrative & Mutation Audit Log (`audit_logs`)
              </h3>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs max-h-64 overflow-y-auto space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-slate-300">
                    <span className="text-slate-500 shrink-0">{formatEpoch(log.createdAt)}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {log.action}
                    </span>
                    <span className="text-slate-400">
                      [{log.targetType}:{log.targetId}]
                    </span>
                    <span className="text-slate-200">{log.details || ''}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: CONTRACTS & MOBILE INTEGRATION */}
        {/* ========================================================================= */}
        {activeTab === 'contracts' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'contract', label: 'API_CONTRACT.md (v2.0)' },
                    { id: 'android_client', label: 'BackendClient.java' },
                    { id: 'android_sync', label: 'TipSync.java' },
                    { id: 'club_logo_helper', label: 'ClubLogoHelper.java' },
                    { id: 'vip_manager', label: 'VipManager.java' },
                    { id: 'migration', label: 'v2_enhancements.sql' },
                    { id: 'python_admin', label: 'admin.py (FastAPI)' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setCodeViewerTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                        codeViewerTab === tab.id
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const text =
                      codeViewerTab === 'contract'
                        ? contractMdContent
                        : codeViewerTab === 'android_client'
                        ? backendClientJavaContent
                        : codeViewerTab === 'android_sync'
                        ? tipSyncJavaContent
                        : codeViewerTab === 'club_logo_helper'
                        ? clubLogoHelperJavaContent
                        : codeViewerTab === 'vip_manager'
                        ? vipManagerJavaContent
                        : codeViewerTab === 'migration'
                        ? migrationSqlContent
                        : pythonAdminContent;
                    copyToClipboard(text, codeViewerTab);
                  }}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                >
                  {copiedText === codeViewerTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedText === codeViewerTab ? 'Copied' : 'Copy File Content'}
                </button>
              </div>

              <div className="p-4 bg-slate-950 font-mono text-xs overflow-x-auto max-h-[560px]">
                <pre className="text-slate-300 leading-relaxed">
                  {codeViewerTab === 'contract' && contractMdContent}
                  {codeViewerTab === 'android_client' && backendClientJavaContent}
                  {codeViewerTab === 'android_sync' && tipSyncJavaContent}
                  {codeViewerTab === 'club_logo_helper' && clubLogoHelperJavaContent}
                  {codeViewerTab === 'vip_manager' && vipManagerJavaContent}
                  {codeViewerTab === 'migration' && migrationSqlContent}
                  {codeViewerTab === 'python_admin' && pythonAdminContent}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: PHASE 1-4 VERIFICATION TEST SUITE */}
        {/* ========================================================================= */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-5">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Automated Phase 1 — Phase 4 Verification Suite
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Directly executes end-to-end tests against the live API to verify Posting Predictions, Admin Match CRUD, Club Logos, Free vs VIP Gating, and Audit Logs.
                  </p>
                </div>
                <button
                  onClick={runFullVerificationSuite}
                  disabled={isRunningTests}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isRunningTests ? 'Running Assertions...' : 'Execute Full Test Suite'}
                </button>
              </div>

              {testResults.length > 0 ? (
                <div className="space-y-3">
                  {testResults.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 flex items-start gap-3"
                    >
                      {t.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{t.name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                            {t.phase}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{t.details}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-sm">
                  Click <span className="text-emerald-400 font-semibold">"Execute Full Test Suite"</span> to run live assertions.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: POST PREDICTION (Accommodate Posting Predictions) */}
      {/* ========================================================================= */}
      {showPostTipModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  Post New Prediction Tip
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Publish expert or Poisson betting predictions. Published predictions are immutable.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                POST /v1/admin/tips
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Fixture Selector */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Select Fixture / Match</label>
                <select
                  value={tipFixtureId}
                  onChange={(e) => {
                    setTipFixtureId(e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                >
                  {fixtures
                    .filter((f) => f.deletedAt === null)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.home} vs {f.away} ({f.league} • {f.status})
                      </option>
                    ))}
                </select>
              </div>

              {/* Market Selector & Presets */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Betting Market</label>
                <select
                  value={tipMarket}
                  onChange={(e) => {
                    const m = e.target.value;
                    setTipMarket(m);
                    const opt = MARKET_OPTIONS.find((item) => item.market === m);
                    if (opt && opt.presets.length > 0) {
                      setTipSelection(opt.presets[0]);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                >
                  {MARKET_OPTIONS.map((m) => (
                    <option key={m.market} value={m.market}>
                      {m.market}
                    </option>
                  ))}
                  <option value="Custom Market">Custom Market</option>
                </select>

                {/* Quick Selection Presets */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-500">Suggested picks:</span>
                  {currentMarketPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTipSelection(preset)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        tipSelection === preset
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selection Input & Tier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Predicted Selection / Pick</label>
                  <input
                    type="text"
                    value={tipSelection}
                    onChange={(e) => setTipSelection(e.target.value)}
                    placeholder="e.g. Home win, Over 2.5, Yes"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Access Tier</label>
                  <select
                    value={tipTier}
                    onChange={(e) => setTipTier(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="free">Free (Public for all users)</option>
                    <option value="premium">Premium (VIP Subscribers Only)</option>
                  </select>
                </div>
              </div>

              {/* Confidence & Risk Gauge */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    Confidence Score: <strong className="text-emerald-400 text-sm font-mono">{tipConfidence}%</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Risk Level:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tipRisk === 'LOW'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : tipRisk === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {tipRisk}
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min={40}
                  max={95}
                  value={tipConfidence}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setTipConfidence(val);
                    setTipRisk(calculateRiskFromConfidence(val));
                  }}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />

                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>40% (High Risk)</span>
                  <span>58% (Medium)</span>
                  <span>70%+ (Low Risk)</span>
                  <span>95% (Max)</span>
                </div>
              </div>

              {/* Analytical Explanation & Magic Draft */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-medium">Analytical Explanation</label>
                  <button
                    type="button"
                    onClick={handleAutoDraftPoisson}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Wand2 className="w-3 h-3" />
                    Auto-Draft Poisson Stats
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={tipExplanation}
                  onChange={(e) => setTipExplanation(e.target.value)}
                  placeholder="e.g. Poisson model lean home (xG 2.1 vs 1.1); home offensive efficiency 68% exceeds league baseline."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 leading-relaxed text-xs"
                />
              </div>

              {/* Model Version */}
              <div>
                <label className="text-slate-400 block mb-1 text-[11px]">Model / Engine Version</label>
                <input
                  type="text"
                  value={tipModelVersion}
                  onChange={(e) => setTipModelVersion(e.target.value)}
                  placeholder="e.g. expert-analyst-1.0 or poisson-emp-1.0"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowPostTipModal(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePostPrediction}
                className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                Publish Prediction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FORCE SETTLE TIP */}
      {/* ========================================================================= */}
      {showForceSettleModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Force Settle Prediction</h3>
            <p className="text-xs text-slate-400 mb-4">
              Commit settlement outcome for prediction <code className="text-emerald-400">{settleTipId}</code>.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Outcome</label>
                <select
                  value={settleOutcome}
                  onChange={(e) => setSettleOutcome(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100"
                >
                  <option value="WON">WON (Win badge)</option>
                  <option value="LOST">LOST</option>
                  <option value="VOID">VOID (Refund / push)</option>
                  <option value="POSTPONED">POSTPONED</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Home Final Goals</label>
                  <input
                    type="number"
                    min={0}
                    value={settleHomeGoals}
                    onChange={(e) => setSettleHomeGoals(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Away Final Goals</label>
                  <input
                    type="number"
                    min={0}
                    value={settleAwayGoals}
                    onChange={(e) => setSettleAwayGoals(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowForceSettleModal(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleForceSettle}
                className="px-4 py-1.5 rounded bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-blue-500/20"
              >
                Save Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE FIXTURE */}
      {/* ========================================================================= */}
      {showCreateFixtureModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Create Match Fixture (Admin)</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter match details. Selecting a registered club automatically populates its Firebase Storage logo!
            </p>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Home Team</label>
                  <input
                    type="text"
                    value={newFxHome}
                    onChange={(e) => setNewFxHome(e.target.value)}
                    placeholder="e.g. FC Arsenal, Madrid Real"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                  {newFxHome && (() => {
                    const dict = dictateClub(newFxHome);
                    return dict.club ? (
                      <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-1 rounded-md">
                        <img src={dict.club.logoUrl} className="w-4 h-4 object-contain shrink-0" alt="" />
                        <span className="font-bold truncate">Auto-Dictated: {dict.club.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">({dict.confidence}%)</span>
                      </div>
                    ) : null;
                  })()}
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Away Team</label>
                  <input
                    type="text"
                    value={newFxAway}
                    onChange={(e) => setNewFxAway(e.target.value)}
                    placeholder="e.g. Chelsea, City Manchester"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                  {newFxAway && (() => {
                    const dict = dictateClub(newFxAway);
                    return dict.club ? (
                      <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-1 rounded-md">
                        <img src={dict.club.logoUrl} className="w-4 h-4 object-contain shrink-0" alt="" />
                        <span className="font-bold truncate">Auto-Dictated: {dict.club.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">({dict.confidence}%)</span>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Link Home Club (Logo)</label>
                  <select
                    value={newFxHomeClubId}
                    onChange={(e) => setNewFxHomeClubId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Auto-detect by name</option>
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Link Away Club (Logo)</label>
                  <select
                    value={newFxAwayClubId}
                    onChange={(e) => setNewFxAwayClubId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Auto-detect by name</option>
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">League</label>
                  <input
                    type="text"
                    value={newFxLeague}
                    onChange={(e) => setNewFxLeague(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Country</label>
                  <input
                    type="text"
                    value={newFxCountry}
                    onChange={(e) => setNewFxCountry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Kickoff Time (UTC Today at Hour)</label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={newFxKickoffHour}
                  onChange={(e) => setNewFxKickoffHour(parseInt(e.target.value, 10) || 18)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowCreateFixtureModal(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFixture}
                className="px-4 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Create Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT FIXTURE */}
      {/* ========================================================================= */}
      {editingFixture && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Edit Match: {editingFixture.home} vs {editingFixture.away}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Update match state, final scores, or minute. Changes immediately take effect on public API.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="SCHEDULED">SCHEDULED (Goals null)</option>
                  <option value="LIVE">LIVE (Minute recorded)</option>
                  <option value="FINISHED">FINISHED (Ready for settlement)</option>
                  <option value="POSTPONED">POSTPONED</option>
                </select>
              </div>

              {editStatus !== 'SCHEDULED' && editStatus !== 'POSTPONED' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-300 block mb-1">{editingFixture.home} Goals</label>
                    <input
                      type="number"
                      min={0}
                      value={editHomeGoals}
                      onChange={(e) => setEditHomeGoals(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1">{editingFixture.away} Goals</label>
                    <input
                      type="number"
                      min={0}
                      value={editAwayGoals}
                      onChange={(e) => setEditAwayGoals(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1">Minute</label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={editMinute}
                      onChange={(e) => setEditMinute(parseInt(e.target.value, 10) || 90)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={() => setEditingFixture(null)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateFixture}
                className="px-4 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UPDATE CLUB LOGO */}
      {/* ========================================================================= */}
      {clubToEditLogo && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Update Club Logo: {clubToEditLogo.name}</h3>
            <p className="text-xs text-slate-400 mb-4">
              Sets public logo URL and Firebase Storage reference{' '}
              <code className="text-emerald-400">clubs/{clubToEditLogo.id}/logo.png</code>.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Public Logo CDN URL</label>
                <input
                  type="text"
                  value={newLogoUrl}
                  onChange={(e) => setNewLogoUrl(e.target.value)}
                  placeholder="https://images.fotmob.com/... or Storage URL"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono text-[11px]"
                />
              </div>

              {newLogoUrl && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <img src={newLogoUrl} alt="Preview" className="w-10 h-10 object-contain" />
                  <span className="text-xs text-slate-400">Live Preview</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={() => setClubToEditLogo(null)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateLogo}
                className="px-4 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Save Logo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GRANT VIP */}
      {/* ========================================================================= */}
      {showGrantVipModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Crown className="w-4 h-4 text-purple-400" />
              Grant VIP Subscription Entitlement
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Activates Gold VIP access on Android. Sets server-side expiration epoch timestamp.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Target User UID</label>
                <input
                  type="text"
                  value={vipTargetUid}
                  onChange={(e) => setVipTargetUid(e.target.value)}
                  placeholder="e.g. free_demo_user"
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Duration (Days)</label>
                <input
                  type="number"
                  min={1}
                  value={vipGrantDays}
                  onChange={(e) => setVipGrantDays(parseInt(e.target.value, 10) || 30)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowGrantVipModal(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantVip}
                className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all cursor-pointer shadow-lg shadow-purple-600/20"
              >
                Grant VIP Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Embedded references for contract viewer
const contractMdContent = `# iGoal Predictions — API Specification & Mobile Contract (v2.0)
Target Package: com.example.igoalpredictions
Production Base URL: https://api.igoalpredictions.com
Protocol: HTTPS / REST JSON

Public Endpoints:
1. GET /v1/health -> {"ok": true, "version": "2.0.0", "mode": "production"}
2. GET /v1/fixtures?date=YYYY-MM-DD -> Includes homeLogoUrl, awayLogoUrl, homeClubId, awayClubId
3. GET /v1/tips?tier=free|premium -> Free is public; Premium returns upgradeRequired: true for Free users
4. GET /v1/results?since={epochSec} -> Settlement evaluation outcomes
5. GET /v1/clubs -> Club logo directory (clubs/{clubId}/logo.png)
6. GET /v1/me -> User profile, role, tier (free/vip), expiresAt epoch seconds

Admin Endpoints (Authorization: Bearer <ADMIN_TOKEN>):
- POST   /v1/admin/fixtures
- PATCH  /v1/admin/fixtures/{id}
- DELETE /v1/admin/fixtures/{id}?force=true
- GET    /v1/admin/fixtures
- POST   /v1/admin/tips (POST PREDICTIONS with auto-risk and auto-explanation)
- DELETE /v1/admin/tips/{id}
- POST   /v1/admin/settlements
- POST   /v1/admin/clubs/{id}/logo
- POST   /v1/admin/users/entitlement
- GET    /v1/admin/audit
`;

const backendClientJavaContent = `package com.example.igoalpredictions.network;

import com.google.gson.annotations.SerializedName;
import java.io.IOException;
import java.util.List;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import com.google.gson.Gson;

public class BackendClient {
    private static final String DEFAULT_BASE_URL = "https://api.igoalpredictions.com";
    private final OkHttpClient httpClient = new OkHttpClient.Builder().build();
    private final Gson gson = new Gson();
    private final String deviceId;
    private String authToken;

    public void setAuthToken(String token) {
        this.authToken = token;
    }
    // Supports: fetchFixtures, fetchTips (with upgradeRequired check), fetchProfile, createFixture, publishTip, deleteFixture
}
`;

const tipSyncJavaContent = `package com.example.igoalpredictions.sync;

import android.content.Context;
import com.example.igoalpredictions.network.BackendClient;

public class TipSync {
    private final BackendClient client;
    public TipSync(Context context, String deviceId) {
        this.client = new BackendClient(deviceId);
    }
    public boolean performSync(String customBaseUrl, String authToken, String todayDateUtc, long lastSettledEpochSec) {
        // 1. Health check
        // 2. Fetch User Profile
        // 3. Fetch fixtures (includes homeLogoUrl, awayLogoUrl)
        // 4. Fetch free tips
        // 5. Fetch premium tips (handles upgradeRequired: true gracefully without crash)
        // 6. Fetch incremental settlements
        return true;
    }
}
`;

const clubLogoHelperJavaContent = `package com.example.igoalpredictions.ui;

import android.graphics.Bitmap;
import android.util.LruCache;
import android.widget.ImageView;
import android.widget.TextView;

/**
 * Loads logo URLs with memory cache; falls back to initials badge without crashing if logoUrl is null.
 */
public class ClubLogoHelper {
    public void loadLogo(ImageView imageView, TextView initialsFallbackView, String logoUrl, String clubName) {
        if (logoUrl == null || logoUrl.trim().isEmpty()) {
            showInitialsFallback(imageView, initialsFallbackView, clubName);
            return;
        }
        // Memory cache lookup & background download...
    }
}
`;

const vipManagerJavaContent = `package com.example.igoalpredictions.vip;

import android.content.Context;
import android.content.SharedPreferences;

public class VipManager {
    public boolean isVip() {
        // Checks tier == 'vip' and expiresAt > nowSec
        return true;
    }
    // Google Play Billing documentation and verification flow
}
`;

const migrationSqlContent = `-- Database Migration v2.0
CREATE TABLE clubs (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    short_name VARCHAR(30) NOT NULL,
    country VARCHAR(64) NOT NULL,
    logo_path VARCHAR(255) NULL,
    logo_url VARCHAR(512) NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE fixtures ADD COLUMN deleted_at BIGINT NULL;
ALTER TABLE fixtures ADD COLUMN home_club_id VARCHAR(64) NULL REFERENCES clubs (id);
ALTER TABLE fixtures ADD COLUMN away_club_id VARCHAR(64) NULL REFERENCES clubs (id);
ALTER TABLE fixtures ADD COLUMN home_logo_url VARCHAR(512) NULL;
ALTER TABLE fixtures ADD COLUMN away_logo_url VARCHAR(512) NULL;

CREATE TABLE users (
    uid VARCHAR(128) PRIMARY KEY,
    email VARCHAR(128) NULL,
    display_name VARCHAR(128) NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    tier VARCHAR(20) NOT NULL DEFAULT 'free',
    vip_expires_at BIGINT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);

CREATE TABLE audit_logs (...);
`;

const pythonAdminContent = `@router.post("/tips", response_model=TipItem)
async def publish_tip(payload: AdminTipCreate, admin: AuthUser = Depends(get_admin_user)):
    # Accommodates posting predictions with auto-derived risk, explanation, and collision-free ID
`;
