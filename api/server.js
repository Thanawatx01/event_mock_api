const fs = require("fs");
const path = require("path");
const jsonServer = require("json-server");
const { Redis } = require("@upstash/redis");

const server = jsonServer.create();
const dbPath = path.join(process.cwd(), "db.json");
const middlewares = jsonServer.defaults({
  noCors: false,
});

/**
 * Vercel / Lambda filesystems are read-only — FileSync writes throw EROFS.
 * On serverless, keep the working copy in memory and (when configured) mirror
 * it to Upstash Redis so mutations survive cold starts.
 */
const isServerless = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME,
);
const seed = JSON.parse(fs.readFileSync(dbPath, "utf8"));
const router = jsonServer.router(
  isServerless ? structuredClone(seed) : dbPath,
);

// Bump the default key when seed schema changes so Vercel Redis rehydrates
 // from db.json instead of keeping a stale snapshot (e.g. bilingual audit_logs).
const REDIS_KEY = process.env.MOCK_DB_REDIS_KEY || "eventmockapi:db:v2";

function getRedis() {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }
  return Redis.fromEnv();
}

function cloneState(value) {
  return structuredClone(value);
}

/**
 * Older Redis snapshots may predate new collections (e.g. audit_logs).
 * Keep persisted rows, but fill any missing top-level keys from db.json
 * so POSTs to new resources do not 404 after a seed deploy.
 */
function mergeMissingCollections(stored) {
  const next = cloneState(stored);
  let changed = false;
  for (const [key, value] of Object.entries(seed)) {
    if (!(key in next)) {
      next[key] = cloneState(value);
      changed = true;
    }
  }
  return { state: next, changed };
}

async function hydrateFromRedis() {
  const redis = getRedis();
  if (!redis) return { redis: null, persisted: false };

  try {
    const stored = await redis.get(REDIS_KEY);
    if (stored && typeof stored === "object" && !Array.isArray(stored)) {
      const { state, changed } = mergeMissingCollections(stored);
      router.db.setState(state);
      if (changed) {
        await redis.set(REDIS_KEY, state);
      }
      return { redis, persisted: true };
    }
    // First deploy / empty key — seed Redis from db.json.
    const initial = cloneState(seed);
    await redis.set(REDIS_KEY, initial);
    router.db.setState(initial);
    return { redis, persisted: true };
  } catch (error) {
    console.error("[mock-api] Redis hydrate failed:", error);
    return { redis, persisted: false };
  }
}

async function persistToRedis(redis) {
  if (!redis) return;
  try {
    await redis.set(REDIS_KEY, cloneState(router.db.getState()));
  } catch (error) {
    console.error("[mock-api] Redis persist failed:", error);
  }
}

function isMutatingMethod(method) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method);
}

server.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.header(
    "X-Mock-Persist",
    getRedis() ? "redis" : isServerless ? "memory" : "file",
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

// Reload shared state before every serverless request so instances converge.
server.use(async (req, res, next) => {
  if (!isServerless) return next();
  const { redis, persisted } = await hydrateFromRedis();
  req.mockRedis = redis;
  req.mockPersisted = persisted;
  return next();
});

server.use(middlewares);
server.use(jsonServer.bodyParser);

// After json-server mutates the in-memory db, write the snapshot back to Redis
// before the response is flushed (so the Lambda does not freeze mid-save).
server.use((req, res, next) => {
  if (!isServerless || !isMutatingMethod(req.method) || !req.mockRedis) {
    return next();
  }

  const wrap = (fn) =>
    function wrapped(body) {
      return persistToRedis(req.mockRedis).then(() => fn.call(this, body));
    };

  res.json = wrap(res.json.bind(res));
  res.send = wrap(res.send.bind(res));
  return next();
});

server.use(router);

module.exports = server;
