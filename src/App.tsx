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
  Unlock
} from 'lucide-react';

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

export default function App() {
  const [activeTab, setActiveTab] = useState<'admin_fixtures' | 'clubs' | 'vip_users' | 'explorer' | 'workers' | 'contracts' | 'tests'>('admin_fixtures');

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
        if (res.status === 400 && data.error && data.error.includes('pass force=true')) {
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

  // Run Comprehensive Contract & Verification Suite (Phase 1-4)
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
      // Create
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

      // Verify immediate reflection on public endpoint
      const pRes = await fetch('/v1/fixtures?date=2026-10-30');
      const pData = await pRes.json();
      const foundInPublic = pData.fixtures.some((f: any) => f.id === testId);

      // Clean up (soft delete)
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

    // Test 4: Phase 2 Club Logos & Storage Paths
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

    // Test 5: Phase 3 Free vs VIP User Gating on Premium Tips
    try {
      // 1. As Free User
      const freeTipsRes = await fetch('/v1/tips?tier=premium', {
        headers: { 'Authorization': 'Bearer demo_free_token' },
      });
      const freeTipsData = await freeTipsRes.json();
      const isFreeGated = freeTipsData.upgradeRequired === true && freeTipsData.tips.length === 0;

      // 2. As VIP User
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

    // Test 6: Phase 3 GET /v1/me Profile Endpoint
    try {
      const meRes = await fetch('/v1/me', { headers: { 'Authorization': 'Bearer demo_vip_token' } });
      const meData = await meRes.json();
      results.push({
        phase: 'Phase 3',
        name: 'User Entitlements Endpoint (GET /v1/me)',
        passed: meRes.status === 200 && meData.tier === 'vip' && meData.isVip === true,
        details: 'Returns authenticated user entitlement tier, role, and Unix epoch seconds expiration.',
      });
    } catch {
      results.push({ phase: 'Phase 3', name: 'User Profile Endpoint', passed: false, details: 'Profile error' });
    }

    // Test 7: Phase 4 Audit Logging
    try {
      const auditRes = await fetch('/v1/admin/audit', { headers: { 'Authorization': `Bearer ${adminToken}` } });
      const auditData = await auditRes.json();
      results.push({
        phase: 'Phase 4',
        name: 'Immutable Audit Logging System (GET /v1/admin/audit)',
        passed: auditRes.status === 200 && Array.isArray(auditData.logs) && auditData.logs.length > 0,
        details: `Active audit stream with ${auditData.logs?.length || 0} recorded administrative mutations.`,
      });
    } catch {
      results.push({ phase: 'Phase 4', name: 'Audit Logging System', passed: false, details: 'Audit fetch error' });
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
                Admin Match CRUD • Firebase Storage Club Logos • Free vs VIP User Gating • Poisson Engine
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

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto flex flex-wrap gap-1 mt-3 border-t border-slate-800/80 pt-2.5">
          {[
            { id: 'admin_fixtures', label: 'Admin Fixtures (CRUD)', icon: Calendar, badge: stats?.totalFixtures },
            { id: 'clubs', label: 'Clubs & Logos (Storage)', icon: Image, badge: stats?.clubsCount },
            { id: 'vip_users', label: 'Free vs VIP Users', icon: Crown, badge: stats?.vipUsersCount ? `${stats.vipUsersCount} VIP` : undefined },
            { id: 'explorer', label: 'Live REST API Explorer', icon: Terminal },
            { id: 'workers', label: 'Engine, Settler & Audit', icon: Zap },
            { id: 'contracts', label: 'Contracts & Android Client', icon: Code2 },
            { id: 'tests', label: 'Verification Suite', icon: CheckCircle2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {/* ========================================================================= */}
        {/* TAB 1: ADMIN FIXTURES CRUD (Phase 1) */}
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

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateFixtureModal(true)}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  <Plus className="w-4 h-4" />
                  Create New Match
                </button>
              </div>
            </div>

            {/* Fixtures Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    Managed Fixtures & Live Status
                  </h3>
                  <p className="text-xs text-slate-400">
                    Changes made here immediately reflect in public <code className="text-emerald-400">GET /v1/fixtures</code>.
                  </p>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Showing {filteredFixtures.length} matches
                </div>
              </div>

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
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CLUBS & FIREBASE STORAGE LOGOS (Phase 2) */}
        {/* ========================================================================= */}
        {activeTab === 'clubs' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Image className="w-5 h-5 text-emerald-400" />
                    Football Clubs Directory & Firebase Storage
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Structured under <code className="text-emerald-400 font-mono">clubs/&#123;clubId&#125;/logo.png</code>. When a logo is updated, it automatically cascades to all scheduled and past fixtures for that club!
                  </p>
                </div>
              </div>

              {/* Clubs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {clubs.map((c) => (
                  <div
                    key={c.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1 overflow-hidden shadow-inner shrink-0">
                          {c.logoUrl ? (
                            <img src={c.logoUrl} alt={c.name} className="w-10 h-10 object-contain" />
                          ) : (
                            <span className="text-xs font-bold text-slate-400">{c.shortName.substring(0, 3)}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-tight">{c.name}</h4>
                          <span className="text-[11px] text-slate-400">{c.country}</span>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-slate-500 bg-slate-900/60 p-2 rounded border border-slate-800/80 break-all">
                        <span className="text-slate-400 block mb-0.5">Storage Path:</span>
                        {c.logoPath || 'Not configured'}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-400 font-mono font-medium">{c.id}</span>
                      <button
                        onClick={() => {
                          setClubToEditLogo(c);
                          setNewLogoUrl(c.logoUrl || '');
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <UploadCloud className="w-3 h-3 text-emerald-400" />
                        Update Logo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: USERS & VIP ENTITLEMENTS (Phase 3) */}
        {/* ========================================================================= */}
        {activeTab === 'vip_users' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Entitlement Architecture */}
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

              {/* Card 2: Quick VIP Simulator */}
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
        {/* TAB 4: LIVE REST API EXPLORER & SANDBOX */}
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
        {/* TAB 5: WORKERS & AUDIT LOGS (Phase 4) */}
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
        {/* TAB 6: CONTRACTS & MOBILE INTEGRATION */}
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
        {/* TAB 7: PHASE 1-4 VERIFICATION TEST SUITE */}
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
                    Directly executes end-to-end tests against the live API to verify Admin Match CRUD, Club Logos, Free vs VIP Gating, and Audit Logs.
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
      {/* MODAL: CREATE FIXTURE (Phase 1) */}
      {/* ========================================================================= */}
      {showCreateFixtureModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Create Match Fixture (Admin)</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter match details. Selecting a registered club automatically populates its Firebase Storage logo!
            </p>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Home Team</label>
                  <input
                    type="text"
                    value={newFxHome}
                    onChange={(e) => setNewFxHome(e.target.value)}
                    placeholder="e.g. Arsenal"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Away Team</label>
                  <input
                    type="text"
                    value={newFxAway}
                    onChange={(e) => setNewFxAway(e.target.value)}
                    placeholder="e.g. Chelsea"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
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
      {/* MODAL: EDIT FIXTURE (Phase 1) */}
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
      {/* MODAL: UPDATE CLUB LOGO (Phase 2) */}
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
      {/* MODAL: GRANT VIP (Phase 3) */}
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
- POST   /v1/admin/tips
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
    // Supports: fetchFixtures, fetchTips (with upgradeRequired check), fetchProfile, createFixture, deleteFixture
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

const pythonAdminContent = `@router.post("/fixtures", response_model=FixtureItem)
async def create_fixture(payload: AdminFixtureCreate, admin: AuthUser = Depends(get_admin_user)):
    # Creates fixture and auto-links club logos

@router.delete("/fixtures/{fixture_id}")
async def delete_fixture(fixture_id: str, force: bool = Query(False), admin: AuthUser = Depends(get_admin_user)):
    # Soft deletes; rejects if settled tips exist unless force=true
`;
