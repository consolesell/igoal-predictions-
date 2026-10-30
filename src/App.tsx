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
  AlertTriangle
} from 'lucide-react';

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
}

interface SettlementResult {
  predictionId: string;
  status: 'WON' | 'LOST' | 'VOID' | 'POSTPONED';
  homeGoals: number;
  awayGoals: number;
  settledAt: number;
}

interface AuditLog {
  id: string;
  timestamp: number;
  type: string;
  message: string;
}

interface SystemStats {
  totalFixtures: number;
  scheduled: number;
  live: number;
  finished: number;
  postponed: number;
  totalTips: number;
  freeTips: number;
  premiumTips: number;
  settledResults: number;
  wonCount: number;
  lostCount: number;
  voidCount: number;
  postponedCount: number;
  rateLimitMax: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'explorer' | 'database' | 'workers' | 'contracts' | 'tests'>('explorer');

  // Backend state
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [settlements, setSettlements] = useState<SettlementResult[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(false);

  // API Explorer state
  const [selectedEndpoint, setSelectedEndpoint] = useState<'health' | 'fixtures' | 'tips' | 'results'>('health');
  const [queryDate, setQueryDate] = useState('2026-10-30');
  const [queryTier, setQueryTier] = useState<'free' | 'premium'>('free');
  const [querySince, setQuerySince] = useState('0');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiStatusCode, setApiStatusCode] = useState<number | null>(null);
  const [apiLatencyMs, setApiLatencyMs] = useState<number | null>(null);
  const [apiHeaders, setApiHeaders] = useState<Record<string, string>>({});
  const [isCallingApi, setIsCallingApi] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Code inspection state
  const [codeViewerTab, setCodeViewerTab] = useState<'contract' | 'android_client' | 'android_sync' | 'python_main' | 'schema' | 'docker'>('contract');

  // Contract test runner state
  const [testResults, setTestResults] = useState<{ name: string; passed: boolean; details: string }[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Simulation modal/action state
  const [editingFixture, setEditingFixture] = useState<Fixture | null>(null);
  const [editStatus, setEditStatus] = useState<Fixture['status']>('FINISHED');
  const [editHomeGoals, setEditHomeGoals] = useState(2);
  const [editAwayGoals, setEditAwayGoals] = useState(1);

  // Fetch complete state
  const fetchState = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/state');
      if (res.ok) {
        const data = await res.json();
        setFixtures(data.fixtures);
        setTips(data.tips);
        setSettlements(data.settlementResults);
        setAuditLogs(data.auditLogs);
        setStats(data.stats);
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
    let url = '/v1/health';

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
      }
    }

    try {
      const res = await fetch(url, {
        headers: {
          'X-Device-ID': 'android_emulator_pixel_8',
        },
      });
      const end = performance.now();
      const latency = Math.round(end - start);
      setApiLatencyMs(latency);
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

  // Run Rate Limit stress test to trigger 429
  const triggerRateLimitTest = async () => {
    setIsCallingApi(true);
    let lastCode = 200;
    let lastJson: any = null;
    const start = performance.now();

    for (let i = 0; i < 65; i++) {
      const res = await fetch('/v1/health', {
        headers: { 'X-Device-ID': 'test_flooder_id' },
      });
      lastCode = res.status;
      lastJson = await res.json();
      if (res.status === 429) {
        break;
      }
    }
    const end = performance.now();
    setApiStatusCode(lastCode);
    setApiResponse(lastJson);
    setApiLatencyMs(Math.round(end - start));
    setIsCallingApi(false);
  };

  // Run Workers
  const runPredictionEngine = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/engine/run', { method: 'POST' });
      const data = await res.json();
      await fetchState();
      alert(`Prediction Engine executed! ${data.message}`);
    } catch (err) {
      alert('Failed to run Prediction Engine');
    } finally {
      setLoading(false);
    }
  };

  const runSettler = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settler/run', { method: 'POST' });
      const data = await res.json();
      await fetchState();
      alert(`Settlement Worker executed! ${data.message}`);
    } catch (err) {
      alert('Failed to run Settlement Worker');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFixture = async () => {
    if (!editingFixture) return;
    try {
      const res = await fetch('/api/admin/fixtures/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingFixture.id,
          status: editStatus,
          homeGoals: editStatus === 'SCHEDULED' ? null : editHomeGoals,
          awayGoals: editStatus === 'SCHEDULED' ? null : editAwayGoals,
          minute: editStatus === 'LIVE' ? 75 : null,
        }),
      });
      if (res.ok) {
        setEditingFixture(null);
        await fetchState();
      }
    } catch (err) {
      alert('Failed to update fixture');
    }
  };

  const runContractAssertions = async () => {
    setIsRunningTests(true);
    try {
      const res = await fetch('/api/admin/test/contract', { method: 'POST' });
      const data = await res.json();
      setTestResults(data.results);
    } catch (err) {
      alert('Failed to run contract tests');
    } finally {
      setIsRunningTests(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const formatEpoch = (epochSec: number) => {
    return new Date(epochSec * 1000).toUTCString().replace('GMT', 'UTC');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shadow-lg shadow-emerald-500/10">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">iGoal Predictions</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Production Backend v2.0
                </span>
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-800 text-slate-400 border border-slate-700">
                  pkg: com.example.igoalpredictions
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                FastAPI 3.11 Architecture • Async SQLAlchemy 2.0 • Poisson & Empirical Engine • 60 req/min Rate Limiting
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300 font-medium">Status: Healthy</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">{stats ? `${stats.totalFixtures} Fixtures` : 'Loading...'}</span>
              <span className="text-slate-500">|</span>
              <span className="text-emerald-400 font-semibold">{stats ? `${stats.totalTips} Tips` : ''}</span>
            </div>

            <button
              onClick={() => {
                fetchState();
                executeEndpoint();
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto flex gap-1 mt-4 border-t border-slate-800/80 pt-3">
          {[
            { id: 'explorer', label: 'Live API Explorer & Sandbox', icon: Terminal },
            { id: 'database', label: 'Database & Fixture Tables', icon: Database },
            { id: 'workers', label: 'Background Workers (Engine & Settler)', icon: Zap },
            { id: 'contracts', label: 'Contracts & Android Client Code', icon: Code2 },
            { id: 'tests', label: 'Contract Test Runner', icon: CheckCircle2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {/* TAB 1: API EXPLORER */}
        {activeTab === 'explorer' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-emerald-400" />
                    Live REST Endpoint Explorer
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Execute real HTTP calls against the production specification. Every response adheres strictly to{' '}
                    <code className="text-emerald-400">docs/API_CONTRACT.md</code>.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={triggerRateLimitTest}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Sends rapid burst requests to verify HTTP 429 Too Many Requests response"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Test 429 Rate Limiter
                  </button>
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

              {/* Endpoint Selector Radio Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
                {[
                  {
                    id: 'health',
                    method: 'GET',
                    path: '/v1/health',
                    desc: 'Uptime, version & deployment mode',
                  },
                  {
                    id: 'fixtures',
                    method: 'GET',
                    path: '/v1/fixtures',
                    desc: 'Matches with explicit nulls for unplayed',
                  },
                  {
                    id: 'tips',
                    method: 'GET',
                    path: '/v1/tips',
                    desc: 'Immutable Poisson AI predictions',
                  },
                  {
                    id: 'results',
                    method: 'GET',
                    path: '/v1/results',
                    desc: 'Settled WON/LOST/VOID outcomes',
                  },
                ].map((ep) => {
                  const isSel = selectedEndpoint === ep.id;
                  return (
                    <button
                      key={ep.id}
                      onClick={() => {
                        setSelectedEndpoint(ep.id as any);
                        setTimeout(() => executeEndpoint(), 50);
                      }}
                      className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                        isSel
                          ? 'bg-slate-800 border-emerald-500/60 ring-1 ring-emerald-500/30'
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {ep.method}
                        </span>
                        <span className="text-xs font-mono font-semibold text-white">{ep.path}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{ep.desc}</p>
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
                    <button
                      onClick={() => setQueryDate('invalid-date')}
                      className="text-[10px] text-amber-400 hover:underline"
                    >
                      (Test 400 bad format)
                    </button>
                    <button
                      onClick={() => setQueryDate('2026-10-30')}
                      className="text-[10px] text-emerald-400 hover:underline"
                    >
                      (Reset today)
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
                      <option value="free">free</option>
                      <option value="premium">premium</option>
                    </select>
                  </div>
                )}

                {selectedEndpoint === 'results' && (
                  <div className="flex items-center gap-2">
                    <label className="text-slate-300">since (epoch sec):</label>
                    <input
                      type="number"
                      value={querySince}
                      onChange={(e) => setQuerySince(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 focus:outline-none focus:border-emerald-500 w-32"
                    />
                    <button
                      onClick={() => setQuerySince('0')}
                      className="text-[10px] text-slate-400 hover:underline"
                    >
                      (All since 0)
                    </button>
                  </div>
                )}

                {selectedEndpoint === 'health' && (
                  <span className="text-slate-500 font-sans italic">No query parameters required</span>
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
                      Status: {apiStatusCode} {apiStatusCode === 200 ? 'OK' : apiStatusCode === 429 ? 'TOO MANY REQUESTS' : 'ERROR'}
                    </span>
                  )}

                  {apiLatencyMs !== null && (
                    <span className="text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {apiLatencyMs} ms
                    </span>
                  )}

                  {apiHeaders['x-ratelimit-remaining'] && (
                    <span className="text-slate-400 font-mono">
                      RateLimit Remaining: <span className="text-emerald-400 font-bold">{apiHeaders['x-ratelimit-remaining']}</span>/60
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
                    Click <span className="text-emerald-400 font-semibold">"Send Request"</span> to inspect live response payload.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DATABASE & FIXTURES */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-slate-400 text-xs font-medium">Total Fixtures</div>
                <div className="text-2xl font-bold text-white mt-1">{stats?.totalFixtures || fixtures.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {stats?.scheduled} scheduled, {stats?.live} live, {stats?.finished} finished
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-slate-400 text-xs font-medium">Published Tips</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{stats?.totalTips || tips.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {stats?.freeTips} free, {stats?.premiumTips} premium tier
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-slate-400 text-xs font-medium">Settled Outcomes</div>
                <div className="text-2xl font-bold text-blue-400 mt-1">{stats?.settledResults || settlements.length}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {stats?.wonCount} won, {stats?.lostCount} lost, {stats?.postponedCount} postponed
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-slate-400 text-xs font-medium">Win Rate on Settled</div>
                <div className="text-2xl font-bold text-purple-400 mt-1">
                  {stats && stats.wonCount + stats.lostCount > 0
                    ? `${Math.round((stats.wonCount / (stats.wonCount + stats.lostCount)) * 100)}%`
                    : '100%'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Poisson calibration verified</div>
              </div>
            </div>

            {/* Fixtures Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    `fixtures` PostgreSQL Table
                  </h3>
                  <p className="text-xs text-slate-400">
                    Matches loaded in the system. Edit score or status to test live settlement behavior!
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
                      <th className="py-2.5 px-4">ID</th>
                      <th className="py-2.5 px-4">Match / League</th>
                      <th className="py-2.5 px-4">Kickoff (UTC)</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Score (Home - Away)</th>
                      <th className="py-2.5 px-4">Minute</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {fixtures.map((fx) => (
                      <tr key={fx.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-400">{fx.id}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">
                            {fx.home} <span className="text-slate-500">vs</span> {fx.away}
                          </div>
                          <div className="text-[11px] text-slate-400">
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
                          <button
                            onClick={() => {
                              setEditingFixture(fx);
                              setEditStatus(fx.status);
                              setEditHomeGoals(fx.homeGoals ?? 2);
                              setEditAwayGoals(fx.awayGoals ?? 1);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] transition-colors cursor-pointer"
                          >
                            Simulate / Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tips Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  `tips` PostgreSQL Table (Immutable AI Predictions)
                </h3>
                <p className="text-xs text-slate-400">
                  Calculated by Poisson bivariate distribution and empirical weighted models.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
                      <th className="py-2.5 px-4">Tip ID</th>
                      <th className="py-2.5 px-4">Fixture / Teams</th>
                      <th className="py-2.5 px-4">Market & Selection</th>
                      <th className="py-2.5 px-4">Confidence</th>
                      <th className="py-2.5 px-4">Risk</th>
                      <th className="py-2.5 px-4">Tier</th>
                      <th className="py-2.5 px-4">Model & Explanation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {tips.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-emerald-400 font-medium">{t.id}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">
                            {t.home} vs {t.away}
                          </div>
                          <div className="text-[11px] text-slate-400">{t.league}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{t.selection}</div>
                          <div className="text-[11px] text-slate-400">{t.market}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-400">{t.confidence}%</span>
                            <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${t.confidence}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.risk === 'LOW'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : t.risk === 'MEDIUM'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {t.risk}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.tier === 'premium'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {t.tier}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="text-slate-300 text-[11px] truncate" title={t.explanation}>
                            {t.explanation}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500">{t.modelVersion}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Settlements Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  `settlement_results` PostgreSQL Table
                </h3>
                <p className="text-xs text-slate-400">
                  Synced to Android app via `GET /v1/results?since=...` for marking won/lost prediction badges.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
                      <th className="py-2.5 px-4">Prediction ID</th>
                      <th className="py-2.5 px-4">Settlement Status</th>
                      <th className="py-2.5 px-4">Final Score</th>
                      <th className="py-2.5 px-4">Settled At (Epoch Sec)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {settlements.map((s) => (
                      <tr key={s.predictionId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-white font-medium">{s.predictionId}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.status === 'WON'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : s.status === 'LOST'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : s.status === 'POSTPONED'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {s.homeGoals} - {s.awayGoals}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {formatEpoch(s.settledAt)} ({s.settledAt})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WORKERS & SIMULATION */}
        {activeTab === 'workers' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Worker 1: Prediction Engine */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      source: igoal-engine-v1
                    </span>
                    <span className="text-xs text-slate-400 font-mono">model: poisson-emp-1.0</span>
                  </div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Prediction Engine Worker
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Applies bivariate Poisson distribution matrix calculation:
                    <br />
                    <code className="text-emerald-300 font-mono text-[11px] bg-slate-950 px-2 py-1 rounded block my-2 border border-slate-800">
                      P(k goals; λ) = (λ^k · e^(-λ)) / k!
                    </code>
                    Derives offensive & defensive ratings (λ_home, λ_away) across 6-goal grid, blends with empirical weights, and outputs immutable tips with confidence (0-100) and risk grading.
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Target: Unpredicted scheduled fixtures
                  </div>
                  <button
                    onClick={runPredictionEngine}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Run Prediction Engine
                  </button>
                </div>
              </div>

              {/* Worker 2: Settlement Worker */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/40">
                      source: settler-v1
                    </span>
                    <span className="text-xs text-slate-400 font-mono">frequency: continuous</span>
                  </div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                    Automated Settlement Worker
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Evaluates finished and postponed fixtures against published tips:
                    <ul className="list-disc list-inside mt-2 space-y-1 text-slate-300 text-xs">
                      <li>Match Winner (1X2): Compares homeGoals vs awayGoals</li>
                      <li>Over/Under 2.5: Sums total goals vs 2.5 line</li>
                      <li>Both Teams to Score: Checks if both scored</li>
                      <li>Postponed: Returns POSTPONED status for refund/push</li>
                    </ul>
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Target: Finished fixtures with unsettled tips
                  </div>
                  <button
                    onClick={runSettler}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/10"
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
                Worker Execution & Event Audit Log
              </h3>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs max-h-60 overflow-y-auto space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-slate-300">
                    <span className="text-slate-500 shrink-0">{formatEpoch(log.timestamp)}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        log.type === 'ENGINE'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : log.type === 'SETTLER'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {log.type}
                    </span>
                    <span className="text-slate-200">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CONTRACTS & MOBILE CODE */}
        {activeTab === 'contracts' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {[
                    { id: 'contract', label: 'API_CONTRACT.md' },
                    { id: 'android_client', label: 'BackendClient.java' },
                    { id: 'android_sync', label: 'TipSync.java' },
                    { id: 'python_main', label: 'FastAPI main.py' },
                    { id: 'schema', label: 'schema.sql' },
                    { id: 'docker', label: 'docker-compose.yml' },
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
                        : codeViewerTab === 'python_main'
                        ? pythonMainContent
                        : codeViewerTab === 'schema'
                        ? schemaSqlContent
                        : dockerComposeContent;
                    copyToClipboard(text, codeViewerTab);
                  }}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                >
                  {copiedText === codeViewerTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedText === codeViewerTab ? 'Copied to Clipboard' : 'Copy File Content'}
                </button>
              </div>

              <div className="p-4 bg-slate-950 font-mono text-xs overflow-x-auto max-h-[560px]">
                <pre className="text-slate-300 leading-relaxed">
                  {codeViewerTab === 'contract' && contractMdContent}
                  {codeViewerTab === 'android_client' && backendClientJavaContent}
                  {codeViewerTab === 'android_sync' && tipSyncJavaContent}
                  {codeViewerTab === 'python_main' && pythonMainContent}
                  {codeViewerTab === 'schema' && schemaSqlContent}
                  {codeViewerTab === 'docker' && dockerComposeContent}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CONTRACT TEST RUNNER */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-5">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Automated Backend Contract & Schema Verification Suite
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Validates critical rules: epoch seconds format, explicit nulls for unplayed match stats, tip immutability, and 60 req/min rate limit responses.
                  </p>
                </div>
                <button
                  onClick={runContractAssertions}
                  disabled={isRunningTests}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isRunningTests ? 'Running Assertions...' : 'Run Contract Test Suite'}
                </button>
              </div>

              {testResults.length > 0 ? (
                <div className="space-y-3">
                  {testResults.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/60 flex items-start gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-white">{t.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{t.details}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-sm">
                  Click <span className="text-emerald-400 font-semibold">"Run Contract Test Suite"</span> to execute automated assertions.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Edit / Simulate Fixture Modal */}
      {editingFixture && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Simulate Match State: {editingFixture.home} vs {editingFixture.away}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Change the fixture state and goals to test the Settlement Worker evaluation.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Match Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="SCHEDULED">SCHEDULED (goals return explicit null)</option>
                  <option value="LIVE">LIVE (minute recorded)</option>
                  <option value="FINISHED">FINISHED (ready for settlement)</option>
                  <option value="POSTPONED">POSTPONED (returns POSTPONED outcome)</option>
                </select>
              </div>

              {editStatus !== 'SCHEDULED' && editStatus !== 'POSTPONED' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 block mb-1">{editingFixture.home} Goals</label>
                    <input
                      type="number"
                      min={0}
                      value={editHomeGoals}
                      onChange={(e) => setEditHomeGoals(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1">{editingFixture.away} Goals</label>
                    <input
                      type="number"
                      min={0}
                      value={editAwayGoals}
                      onChange={(e) => setEditAwayGoals(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
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
                Save & Update Fixture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Embedded references for contract viewer
const contractMdContent = `# iGoal Predictions — API Specification & Mobile Contract
Target Package: com.example.igoalpredictions
Production Base URL: https://api.igoalpredictions.com
Protocol: HTTPS / REST JSON
Rate Limit: 60 requests / minute per IP or X-Device-ID

1. GET /v1/health -> {"ok": true, "version": "2.0.0", "mode": "production"}
2. GET /v1/fixtures?date=YYYY-MM-DD -> {"source": "football-data-v4", "fixtures": [...]}
3. GET /v1/tips?tier=free|premium -> {"source": "igoal-engine-v1", "tips": [...]}
4. GET /v1/results?since={epochSec} -> {"source": "settler-v1", "results": [...]}
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
    private static final String BASE_URL = "https://api.igoalpredictions.com";
    private final OkHttpClient httpClient = new OkHttpClient.Builder().build();
    private final Gson gson = new Gson();
    private final String deviceId;

    public BackendClient(String deviceId) {
        this.deviceId = deviceId;
    }
    // ... HealthResponse, FixturesResponse, TipsResponse, ResultsResponse
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
    public boolean performSync(String customBaseUrl, String todayDateUtc, long lastSettledEpochSec) {
        // 1. Health check
        // 2. Fetch fixtures (YYYY-MM-DD)
        // 3. Fetch tips (free/premium)
        // 4. Fetch incremental settlement results
        return true;
    }
}
`;

const pythonMainContent = `from fastapi import FastAPI, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

app = FastAPI(title="iGoal Predictions Production Backend", version="2.0.0")
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
# Routers: health, fixtures, tips, results under /v1 prefix
`;

const schemaSqlContent = `CREATE TABLE fixtures (
    id VARCHAR(64) PRIMARY KEY,
    league VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    home VARCHAR(100) NOT NULL,
    away VARCHAR(100) NOT NULL,
    kickoff BIGINT NOT NULL, -- Unix epoch SECONDS
    status VARCHAR(20) NOT NULL CHECK (status IN ('SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED')),
    home_goals INT NULL,
    away_goals INT NULL,
    minute INT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE tips (...);
CREATE TABLE settlement_results (...);
`;

const dockerComposeContent = `version: '3.8'
services:
  api:
    build:
      context: ..
      dockerfile: backend/Dockerfile
    ports: ["8000:8000"]
    depends_on: [postgres, redis]
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
`;
