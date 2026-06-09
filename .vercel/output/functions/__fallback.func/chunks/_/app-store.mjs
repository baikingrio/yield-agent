import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const DEMO_PACT_PREFIX = "pact-demo-";
const DEMO_STRATEGY_PREFIX = "str-demo-";
const DEMO_LOG_IDS = /* @__PURE__ */ new Set(["log-1", "log-2", "log-3", "log-4", "log-5"]);
function stripDemoSeedData(state) {
  const demoPactIds = state.pacts.filter((p) => p.id.startsWith(DEMO_PACT_PREFIX)).map((p) => p.id);
  const demoPactIdSet = new Set(demoPactIds);
  const hasDemoStrategies = state.strategies.some((s) => s.id.startsWith(DEMO_STRATEGY_PREFIX));
  const hasDemoPacts = demoPactIds.length > 0;
  const hasDemoLogs = state.logs.some((l) => DEMO_LOG_IDS.has(l.id));
  if (!hasDemoStrategies && !hasDemoPacts && !hasDemoLogs) {
    return { state, changed: false, removedPactIds: [] };
  }
  const next = {
    ...state,
    strategies: state.strategies.filter(
      (s) => !s.id.startsWith(DEMO_STRATEGY_PREFIX) && !demoPactIdSet.has(s.pactId)
    ),
    pacts: state.pacts.filter((p) => !demoPactIdSet.has(p.id)),
    logs: state.logs.filter(
      (l) => !DEMO_LOG_IDS.has(l.id) && !(l.pactId && demoPactIdSet.has(l.pactId))
    )
  };
  if (hasDemoPacts || hasDemoStrategies) {
    next.yieldSeries7d = [];
    next.yieldSeries30d = [];
  }
  return { state: next, changed: true, removedPactIds: demoPactIds };
}

const EOA_ADDRESS_RE$1 = /^0x[a-fA-F0-9]{40}$/;
const LEGACY_EOA_ADDRESSES = /* @__PURE__ */ new Set(["0xeoa", "0xdemo"]);
const LEGACY_AGENT_ADDRESSES = /* @__PURE__ */ new Set(["0xagent"]);
function isLegacyPrepFixture(prep) {
  var _a, _b;
  const eoaAddr = (_a = prep.eoa.address) == null ? void 0 : _a.toLowerCase();
  if (prep.eoa.connected && eoaAddr) {
    if (!EOA_ADDRESS_RE$1.test(prep.eoa.address)) return true;
    if (LEGACY_EOA_ADDRESSES.has(eoaAddr)) return true;
  }
  if (prep.eoa.label.trim().toLowerCase() === "demo eoa") return true;
  const agentAddr = (_b = prep.agentWallet.address) == null ? void 0 : _b.toLowerCase();
  if (agentAddr && LEGACY_AGENT_ADDRESSES.has(agentAddr)) return true;
  return false;
}
function stripLegacyPrepFixtures(state) {
  if (!isLegacyPrepFixture(state.walletPreparation)) {
    return { state, changed: false, source: "none" };
  }
  const legacy = loadPersistedSession();
  if (legacy && !isLegacyPrepFixture(legacy.walletPreparation)) {
    return {
      state: {
        ...state,
        walletPreparation: legacy.walletPreparation,
        settings: { ...state.settings, ...legacy.settings },
        wallet: { ...state.wallet, ...legacy.wallet }
      },
      changed: true,
      source: "legacy-json"
    };
  }
  return {
    state: {
      ...state,
      walletPreparation: createInitialWalletPreparation(state.settings.network),
      wallet: {
        address: "",
        totalAssetsUsdc: 0,
        currentApy: 0,
        cumulativeYieldUsdc: 0
      }
    },
    changed: true,
    source: "reset"
  };
}

const SCHEMA_VERSION = 1;
function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS strategies (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pacts (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS execution_logs (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS kv_blob (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pact_credentials (
      pact_id TEXT PRIMARY KEY,
      api_key TEXT NOT NULL,
      stored_at TEXT NOT NULL
    );
  `);
  const row = db.prepare("SELECT value FROM meta WHERE key = ?").get("schema_version");
  if (!row) {
    db.prepare("INSERT INTO meta (key, value) VALUES (?, ?)").run(
      "schema_version",
      String(SCHEMA_VERSION)
    );
  }
}

const require$1 = createRequire(globalThis._importMeta_.url);
let database = null;
let sqliteUnavailable = false;
function loadDatabaseSyncCtor() {
  if (sqliteUnavailable) return null;
  try {
    return require$1("node:sqlite").DatabaseSync;
  } catch {
    sqliteUnavailable = true;
    return null;
  }
}
function getDatabasePath() {
  var _a;
  const explicit = (_a = process.env.DATABASE_PATH) == null ? void 0 : _a.trim();
  if (explicit) return explicit;
  if (process.env.VERCEL === "1") return "/tmp/yieldagent.db";
  return join(process.cwd(), ".data", "yieldagent.db");
}
function getDatabase() {
  if (database) return database;
  const DatabaseSyncCtor = loadDatabaseSyncCtor();
  if (!DatabaseSyncCtor) {
    throw new Error("SQLITE_UNAVAILABLE");
  }
  const path = getDatabasePath();
  if (path !== ":memory:") {
    const dir = dirname(path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
  database = new DatabaseSyncCtor(path);
  initSchema(database);
  return database;
}

function readBlob(key, fallback) {
  const row = getDatabase().prepare("SELECT value FROM kv_blob WHERE key = ?").get(key);
  if (!(row == null ? void 0 : row.value)) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return fallback;
  }
}
function writeBlob(key, value) {
  getDatabase().prepare("INSERT INTO kv_blob (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, JSON.stringify(value));
}
function readRows(table) {
  const rows = getDatabase().prepare(`SELECT data FROM ${table}`).all();
  return rows.map((row) => {
    try {
      return JSON.parse(row.data);
    } catch {
      return null;
    }
  }).filter((item) => item !== null);
}
function replaceRows(table, items) {
  const db = getDatabase();
  db.exec("BEGIN");
  try {
    db.exec(`DELETE FROM ${table}`);
    const stmt = db.prepare(`INSERT INTO ${table} (id, data) VALUES (?, ?)`);
    for (const item of items) {
      stmt.run(item.id, JSON.stringify(item));
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
function isDatabaseInitialized() {
  const row = getDatabase().prepare("SELECT COUNT(*) AS count FROM kv_blob").get();
  return row.count > 0;
}
function loadStateFromDatabase() {
  var _a;
  if (!isDatabaseInitialized()) return null;
  const seed = createInitialState();
  return {
    wallet: readBlob("wallet", seed.wallet),
    walletPreparation: readBlob("wallet_preparation", seed.walletPreparation),
    settings: readBlob("settings", seed.settings),
    strategies: readRows("strategies"),
    pacts: readRows("pacts"),
    logs: readRows("execution_logs"),
    yieldSeries7d: readBlob("yield_series_7d", seed.yieldSeries7d),
    yieldSeries30d: readBlob("yield_series_30d", seed.yieldSeries30d),
    yieldSnapshotLastSuppliedUsdc: readBlob(
      "yield_snapshot_last_supplied",
      (_a = seed.yieldSnapshotLastSuppliedUsdc) != null ? _a : null
    )
  };
}
function importLegacyJsonSession(state) {
  const legacy = loadPersistedSession();
  if (!legacy) return state;
  return {
    ...state,
    walletPreparation: legacy.walletPreparation,
    settings: { ...state.settings, ...legacy.settings },
    wallet: { ...state.wallet, ...legacy.wallet }
  };
}
function hydrateInitialState() {
  try {
    const fromDb = loadStateFromDatabase();
    if (fromDb) {
      let state2 = fromDb;
      let dirty = false;
      const seedStrip = stripDemoSeedData(state2);
      state2 = seedStrip.state;
      if (seedStrip.changed) {
        dirty = true;
        for (const pactId of seedStrip.removedPactIds) {
          deletePactCredential(pactId);
        }
      }
      const prepStrip = stripLegacyPrepFixtures(state2);
      state2 = prepStrip.state;
      if (prepStrip.changed) dirty = true;
      if (dirty) saveStateToDatabase(state2);
      return state2;
    }
    let state = createInitialState();
    state = importLegacyJsonSession(state);
    saveStateToDatabase(state);
    return state;
  } catch (err) {
    console.warn("[yield-agent] SQLite unavailable; using ephemeral in-memory state.", err);
    return createInitialState();
  }
}
function saveStateToDatabase(state) {
  var _a;
  writeBlob("wallet", state.wallet);
  writeBlob("wallet_preparation", state.walletPreparation);
  writeBlob("settings", state.settings);
  writeBlob("yield_series_7d", state.yieldSeries7d);
  writeBlob("yield_series_30d", state.yieldSeries30d);
  writeBlob("yield_snapshot_last_supplied", (_a = state.yieldSnapshotLastSuppliedUsdc) != null ? _a : null);
  replaceRows("strategies", state.strategies);
  replaceRows("pacts", state.pacts);
  replaceRows("execution_logs", state.logs);
}
function storePactCredential(pactId, apiKey) {
  getDatabase().prepare(
    "INSERT INTO pact_credentials (pact_id, api_key, stored_at) VALUES (?, ?, ?) ON CONFLICT(pact_id) DO UPDATE SET api_key = excluded.api_key, stored_at = excluded.stored_at"
  ).run(pactId, apiKey, (/* @__PURE__ */ new Date()).toISOString());
}
function getPactCredential(pactId) {
  var _a;
  const row = getDatabase().prepare("SELECT api_key FROM pact_credentials WHERE pact_id = ?").get(pactId);
  return ((_a = row == null ? void 0 : row.api_key) == null ? void 0 : _a.trim()) || null;
}
function deletePactCredential(pactId) {
  getDatabase().prepare("DELETE FROM pact_credentials WHERE pact_id = ?").run(pactId);
}

const STATE_FILE = join(process.cwd(), ".data", "demo-session.json");
let persistTimer = null;
function loadPersistedSession() {
  try {
    if (!existsSync(STATE_FILE)) return null;
    const raw = readFileSync(STATE_FILE, "utf8").trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!(parsed == null ? void 0 : parsed.walletPreparation) || !(parsed == null ? void 0 : parsed.settings)) return null;
    return parsed;
  } catch {
    return null;
  }
}
function schedulePersistAppState(state) {
  if (process.env.VITEST) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      saveStateToDatabase(state);
    } catch {
    }
  }, 200);
}

const EOA_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
function createInitialWalletPreparation(network = "base-sepolia") {
  return {
    network,
    eoa: {
      connected: false,
      address: null,
      label: ""
    },
    agentWallet: {
      created: false,
      address: "",
      coboWalletId: null,
      pairing: {
        status: "unpaired",
        code: null,
        expiresAt: null
      }
    },
    funding: {
      status: "idle",
      depositedUsdc: 0,
      availableUsdc: 0,
      lastTxHash: null
    },
    agentBootstrap: {
      mode: null,
      phase: "idle",
      sessionId: null,
      walletStatus: null,
      tssOnline: null,
      message: null
    },
    steps: {
      eoa: "pending",
      agent_wallet: "pending",
      funding: "pending"
    },
    ready: false,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function syncReady(prep) {
  prep.ready = prep.steps.eoa === "completed" && prep.steps.agent_wallet === "completed" && prep.steps.funding === "completed" && prep.funding.status === "ready";
}
function touchPreparation(prep, state) {
  prep.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  syncReady(prep);
  if (state) schedulePersistAppState(state);
}
function getWalletPreparation(state) {
  return state.walletPreparation;
}
function connectEoa(state, params) {
  var _a;
  const address = params.address.trim();
  if (!EOA_ADDRESS_RE.test(address)) {
    throw new Error("INVALID_EOA_ADDRESS");
  }
  const prep = state.walletPreparation;
  prep.eoa.connected = true;
  prep.eoa.address = address;
  prep.eoa.label = ((_a = params.label) == null ? void 0 : _a.trim()) || "\u5DF2\u8FDE\u63A5\u94B1\u5305";
  prep.steps.eoa = "completed";
  touchPreparation(prep, state);
  return prep;
}
function disconnectEoa(state) {
  const prep = state.walletPreparation;
  prep.eoa.connected = false;
  prep.eoa.address = null;
  prep.eoa.label = "";
  prep.steps.eoa = "pending";
  prep.steps.agent_wallet = "pending";
  prep.steps.funding = "pending";
  prep.agentWallet.created = false;
  prep.agentWallet.address = "";
  prep.agentWallet.coboWalletId = null;
  prep.agentWallet.pairing = { status: "unpaired", code: null, expiresAt: null };
  prep.funding.status = "idle";
  prep.funding.depositedUsdc = 0;
  prep.funding.availableUsdc = 0;
  prep.funding.lastTxHash = null;
  state.wallet.totalAssetsUsdc = 0;
  state.wallet.address = "";
  touchPreparation(prep, state);
  return prep;
}
function markAgentWalletPreparing(state, params) {
  const prep = state.walletPreparation;
  prep.agentWallet.created = false;
  prep.agentWallet.address = "";
  prep.agentWallet.coboWalletId = params.coboWalletId;
  if (params.pairing) {
    prep.agentWallet.pairing = params.pairing;
  }
  prep.steps.agent_wallet = "in_progress";
  touchPreparation(prep, state);
  return prep;
}
function markAgentWalletCreated(state, params) {
  var _a, _b;
  const prep = state.walletPreparation;
  prep.agentWallet.created = true;
  prep.agentWallet.address = params.address;
  prep.agentWallet.coboWalletId = params.coboWalletId;
  prep.agentWallet.pairing = (_b = (_a = params.pairing) != null ? _a : prep.agentWallet.pairing) != null ? _b : {
    status: "unpaired",
    code: null,
    expiresAt: null
  };
  state.wallet.address = params.address;
  prep.steps.agent_wallet = prep.agentWallet.pairing.status === "paired" ? "completed" : "in_progress";
  touchPreparation(prep, state);
  return prep;
}
function applyDepositToState(state, amountUsdc, txHash) {
  const prep = state.walletPreparation;
  prep.funding.status = "ready";
  prep.funding.depositedUsdc = amountUsdc;
  prep.funding.availableUsdc = amountUsdc;
  prep.funding.lastTxHash = txHash;
  state.wallet.totalAssetsUsdc = amountUsdc;
  state.wallet.address = prep.agentWallet.address;
  prep.steps.funding = "completed";
  touchPreparation(prep, state);
  return prep;
}
function resetWalletPreparation(state) {
  const network = state.settings.network;
  state.walletPreparation = createInitialWalletPreparation(network);
  state.wallet.totalAssetsUsdc = 0;
  state.wallet.address = "";
  touchPreparation(state.walletPreparation, state);
  return state.walletPreparation;
}

function createInitialState() {
  return {
    wallet: {
      address: "",
      totalAssetsUsdc: 0,
      currentApy: 0,
      cumulativeYieldUsdc: 0
    },
    walletPreparation: createInitialWalletPreparation("base-sepolia"),
    strategies: [],
    pacts: [],
    logs: [],
    yieldSeries7d: [],
    yieldSeries30d: [],
    settings: {
      network: "base-sepolia",
      apiKeyConfigured: false,
      defaultAgentFee: 15,
      userSplit: 85
    }
  };
}

let state = hydrateInitialState();
function getState() {
  return state;
}
function persistCurrentState() {
  schedulePersistAppState(state);
}

export { getPactCredential as a, storePactCredential as b, getWalletPreparation as c, deletePactCredential as d, connectEoa as e, disconnectEoa as f, getState as g, applyDepositToState as h, markAgentWalletPreparing as i, markAgentWalletCreated as m, persistCurrentState as p, resetWalletPreparation as r, schedulePersistAppState as s, touchPreparation as t };
//# sourceMappingURL=app-store.mjs.map
