/**
 * AccessHub performance benchmark
 * ---------------------------------------------------------------
 * Pure Node.js (uses the built-in `fetch`, Node 18+) — no extra
 * dependencies to install. Run this against a LIVE backend:
 *
 *   1. cd backend && npm install
 *   2. Start Postgres and load database/schema.sql + database/seed.sql
 *   3. npm start   (backend now listening on :5001)
 *   4. node tests/benchmark.js
 *
 * Env vars:
 *   BASE_URL   (default http://localhost:5001)
 *   REQS       requests per single-endpoint timing pass (default 50)
 *   CONCURRENCY_LEVELS  comma list, default "1,10,25,50"
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:5001";
const REQS = parseInt(process.env.REQS || "50", 10);
const CONCURRENCY_LEVELS = (process.env.CONCURRENCY_LEVELS || "1,10,25,50")
  .split(",")
  .map((n) => parseInt(n.trim(), 10));

const results = {};

function stats(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const p = (pct) => sorted[Math.min(sorted.length - 1, Math.floor((pct / 100) * sorted.length))];
  return {
    count: sorted.length,
    avg_ms: +(sum / sorted.length).toFixed(2),
    min_ms: +sorted[0].toFixed(2),
    max_ms: +sorted[sorted.length - 1].toFixed(2),
    p95_ms: +p(95).toFixed(2),
  };
}

async function timedRequest(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const start = performance.now();
  let status = 0;
  let ok = false;
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    status = res.status;
    ok = res.ok;
    await res.text(); // drain body so the connection can be reused
  } catch (e) {
    status = -1;
    ok = false;
  }
  const ms = performance.now() - start;
  return { ms, status, ok };
}

async function timeEndpoint(label, method, path, opts, n = REQS) {
  const samples = [];
  let errors = 0;
  for (let i = 0; i < n; i++) {
    const { ms, ok } = await timedRequest(method, path, opts);
    samples.push(ms);
    if (!ok) errors++;
  }
  const s = stats(samples);
  s.error_rate_pct = +((errors / n) * 100).toFixed(2);
  results[label] = s;
  console.log(
    `${label.padEnd(38)} avg=${s.avg_ms}ms  p95=${s.p95_ms}ms  min=${s.min_ms}ms  max=${s.max_ms}ms  errors=${s.error_rate_pct}%`
  );
  return s;
}

async function concurrencyTest(label, method, path, opts, concurrency) {
  const start = performance.now();
  const promises = Array.from({ length: concurrency }, () => timedRequest(method, path, opts));
  const outcomes = await Promise.all(promises);
  const totalMs = performance.now() - start;
  const errors = outcomes.filter((o) => !o.ok).length;
  const avgLatency = outcomes.reduce((a, o) => a + o.ms, 0) / outcomes.length;
  const rps = +((concurrency / (totalMs / 1000)).toFixed(2));
  const row = {
    concurrency,
    total_ms: +totalMs.toFixed(2),
    requests_per_second: rps,
    avg_response_ms: +avgLatency.toFixed(2),
    error_rate_pct: +((errors / concurrency) * 100).toFixed(2),
  };
  results[`${label}_c${concurrency}`] = row;
  console.log(
    `  concurrency=${concurrency}  RPS=${row.requests_per_second}  avg=${row.avg_response_ms}ms  errors=${row.error_rate_pct}%`
  );
  return row;
}

async function setupTestUser() {
  const email = `bench_${Date.now()}@example.com`;
  const reg = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Benchmark User",
      email,
      password: "BenchmarkPass123!",
      organizationName: `BenchOrg ${Date.now()}`,
    }),
  });
  if (!reg.ok) {
    console.error("Could not register a benchmark test user:", reg.status, await reg.text());
    return null;
  }
  const data = await reg.json();
  return { token: data.token, email };
}

async function main() {
  console.log(`AccessHub benchmark — target ${BASE_URL}\n`);

  // 0. Reachability check
  const health = await timedRequest("GET", "/api/health");
  if (health.status === -1) {
    console.error(
      "Could not reach the backend. Start it first (npm install && npm start inside backend/, with Postgres running and .env configured)."
    );
    process.exit(1);
  }

  // 1. Set up an authenticated user (register creates an Admin role,
  //    but note: out of the box, seed.sql does NOT link role_permissions
  //    or create any users, and /api/auth/register does not attach any
  //    permissions to the Admin role it creates either. Permission-gated
  //    endpoints (requirePermission(...)) will 403 until you run
  //    tests/rbac-setup.sql to wire the Admin role to permissions.)
  const user = await setupTestUser();
  const token = user ? user.token : null;

  console.log("\n--- Authorization middleware latency ---");
  await timeEndpoint("Unprotected route (/api/health)", "GET", "/api/health");
  await timeEndpoint("authenticateToken only (/api/protected)", "GET", "/api/protected", { token });
  if (token) {
    await timeEndpoint(
      "authenticateToken + requirePermission (/api/employees)",
      "GET",
      "/api/employees",
      { token }
    );
  }
  console.log(
    "Note: the gap between '/api/health' and '/api/protected' approximates JWT verification cost;"
  );
  console.log(
    "the gap between '/api/protected' and '/api/employees' approximates the requirePermission DB round-trip (also a proxy for DB query time)."
  );

  console.log("\n--- API response time (representative endpoints) ---");
  await timeEndpoint("GET /api/dashboard/stats", "GET", "/api/dashboard/stats", { token });
  await timeEndpoint("GET /api/employees", "GET", "/api/employees", { token });
  await timeEndpoint("GET /api/roles", "GET", "/api/roles", { token });
  await timeEndpoint("GET /api/applications", "GET", "/api/applications", { token });
  await timeEndpoint("GET /api/audit-logs", "GET", "/api/audit-logs", { token });
  await timeEndpoint("GET /api/db-test (raw DB round trip)", "GET", "/api/db-test");

  console.log("\n--- Dashboard load time (parallel fetch, as the UI does) ---");
  {
    const paths = [
      "/api/dashboard/stats",
      "/api/employees",
      "/api/roles",
      "/api/applications",
      "/api/audit-logs",
    ];
    const start = performance.now();
    await Promise.all(paths.map((p) => timedRequest("GET", p, { token })));
    const ms = performance.now() - start;
    results.dashboard_load_time_ms = +ms.toFixed(2);
    console.log(`Full dashboard (all widgets in parallel): ${ms.toFixed(2)} ms`);
  }

  console.log("\n--- Audit-log-writing endpoint timing (login writes an audit_logs row) ---");
  await timeEndpoint(
    "POST /api/auth/login (includes 1 audit_logs INSERT)",
    "POST",
    "/api/auth/login",
    { body: { email: user ? user.email : "nobody@example.com", password: "BenchmarkPass123!" } }
  );

  console.log("\n--- Concurrent-user testing / requests per second ---");
  for (const c of CONCURRENCY_LEVELS) {
    await concurrencyTest("dashboard_stats", "GET", "/api/dashboard/stats", { token }, c);
  }

  console.log("\n--- Protected endpoint sweep (unauthenticated) ---");
  const endpoints = [
    ["GET", "/api/employees"],
    ["GET", "/api/roles"],
    ["GET", "/api/applications"],
    ["GET", "/api/access"],
    ["GET", "/api/audit-logs"],
    ["GET", "/api/dashboard/stats"],
    ["GET", "/api/protected"],
  ];
  let protectedCount = 0;
  for (const [method, path] of endpoints) {
    const r = await timedRequest(method, path);
    const isProtected = r.status === 401;
    if (isProtected) protectedCount++;
    console.log(`  ${method} ${path} -> ${r.status} ${isProtected ? "(protected ✓)" : ""}`);
  }
  results.protected_endpoints_verified = `${protectedCount}/${endpoints.length} sampled routes returned 401 without a token`;

  console.log("\n=== JSON summary ===");
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
