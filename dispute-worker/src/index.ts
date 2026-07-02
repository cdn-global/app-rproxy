import { Hono } from "hono"
import { cors } from "hono/cors"

export interface Env {
  DISPUTE_DB: D1Database
  WORKER_SECRET: string
}

const app = new Hono<{ Bindings: Env }>()

// ── CORS & auth middleware ────────────────────────────────────────────────────
app.use("*", cors())

app.use("*", async (c, next) => {
  const secret = c.req.header("X-Worker-Secret")
  if (!secret || secret !== c.env.WORKER_SECRET) {
    return c.json({ error: "Unauthorized" }, 401)
  }
  await next()
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function uid(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

// ── Dispute Cases ─────────────────────────────────────────────────────────────
app.get("/cases", async (c) => {
  const { results } = await c.env.DISPUTE_DB.prepare(`
    SELECT dc.*,
      (SELECT COUNT(*) FROM dispute_event  WHERE dispute_case_id = dc.id) AS event_count,
      (SELECT COUNT(*) FROM evidence_snapshot WHERE dispute_case_id = dc.id) AS snapshot_count
    FROM dispute_case dc
    ORDER BY dc.created_at DESC
  `).all()
  return c.json(results)
})

app.post("/cases", async (c) => {
  const body = await c.req.json<{
    user_id?: string
    user_email: string
    user_full_name?: string
    stripe_dispute_id?: string
    stripe_charge_id?: string
    reason?: string
    disputed_amount_usd?: number
    currency?: string
    response_due_date?: string
    notes?: string
    created_by?: string
  }>()

  const id = uid()
  await c.env.DISPUTE_DB.prepare(`
    INSERT INTO dispute_case
      (id, user_id, user_email, user_full_name, stripe_dispute_id, stripe_charge_id,
       reason, disputed_amount_usd, currency, response_due_date, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    body.user_id ?? null,
    body.user_email,
    body.user_full_name ?? null,
    body.stripe_dispute_id ?? null,
    body.stripe_charge_id ?? null,
    body.reason ?? "other",
    body.disputed_amount_usd ?? 0,
    body.currency ?? "USD",
    body.response_due_date ?? null,
    body.notes ?? null,
    body.created_by ?? null,
  ).run()

  // Log creation event
  await c.env.DISPUTE_DB.prepare(`
    INSERT INTO dispute_event (id, dispute_case_id, event_type, content, created_by)
    VALUES (?, ?, 'note', ?, ?)
  `).bind(uid(), id, `Case opened. Charge: ${body.stripe_charge_id ?? "N/A"}`, body.created_by ?? null).run()

  return c.json({ id }, 201)
})

app.get("/cases/:id", async (c) => {
  const id = c.req.param("id")
  const caseRow = await c.env.DISPUTE_DB.prepare(
    "SELECT * FROM dispute_case WHERE id = ?"
  ).bind(id).first()

  if (!caseRow) return c.json({ error: "Not found" }, 404)

  const [events, snapshots, seedSummary] = await Promise.all([
    c.env.DISPUTE_DB.prepare(
      "SELECT * FROM dispute_event WHERE dispute_case_id = ? ORDER BY created_at DESC"
    ).bind(id).all(),
    c.env.DISPUTE_DB.prepare(
      "SELECT id, generated_at, generated_by FROM evidence_snapshot WHERE dispute_case_id = ? ORDER BY generated_at DESC"
    ).bind(id).all(),
    c.env.DISPUTE_DB.prepare(`
      SELECT
        (SELECT COUNT(*) FROM seeded_login_event  WHERE dispute_case_id = ?) AS login_events,
        (SELECT MIN(created_at) FROM seeded_login_event WHERE dispute_case_id = ?) AS login_first,
        (SELECT MAX(created_at) FROM seeded_login_event WHERE dispute_case_id = ?) AS login_last,
        (SELECT COUNT(*) FROM seeded_api_request   WHERE dispute_case_id = ?) AS api_requests,
        (SELECT MIN(created_at) FROM seeded_api_request WHERE dispute_case_id = ?) AS api_first,
        (SELECT MAX(created_at) FROM seeded_api_request WHERE dispute_case_id = ?) AS api_last,
        (SELECT COUNT(*) FROM seeded_llm_usage     WHERE dispute_case_id = ?) AS llm_rows,
        (SELECT SUM(total_cost) FROM seeded_llm_usage WHERE dispute_case_id = ?) AS llm_total_cost
    `).bind(id, id, id, id, id, id, id, id).first(),
  ])

  return c.json({
    ...caseRow,
    events: events.results,
    snapshots: snapshots.results,
    seed_summary: seedSummary,
  })
})

app.patch("/cases/:id", async (c) => {
  const id = c.req.param("id")
  const body = await c.req.json<{
    status?: string
    notes?: string
    response_due_date?: string
    stripe_dispute_id?: string
    stripe_charge_id?: string
    updated_by?: string
  }>()

  const existing = await c.env.DISPUTE_DB.prepare(
    "SELECT status FROM dispute_case WHERE id = ?"
  ).bind(id).first<{ status: string }>()
  if (!existing) return c.json({ error: "Not found" }, 404)

  await c.env.DISPUTE_DB.prepare(`
    UPDATE dispute_case SET
      status = COALESCE(?, status),
      notes  = COALESCE(?, notes),
      response_due_date  = COALESCE(?, response_due_date),
      stripe_dispute_id  = COALESCE(?, stripe_dispute_id),
      stripe_charge_id   = COALESCE(?, stripe_charge_id),
      updated_at = ?
    WHERE id = ?
  `).bind(
    body.status ?? null,
    body.notes ?? null,
    body.response_due_date ?? null,
    body.stripe_dispute_id ?? null,
    body.stripe_charge_id ?? null,
    now(),
    id,
  ).run()

  // Log status change
  if (body.status && body.status !== existing.status) {
    await c.env.DISPUTE_DB.prepare(`
      INSERT INTO dispute_event (id, dispute_case_id, event_type, content, created_by)
      VALUES (?, ?, 'status_change', ?, ?)
    `).bind(
      uid(), id,
      `Status changed from ${existing.status} → ${body.status}`,
      body.updated_by ?? null,
    ).run()
  }

  return c.json({ ok: true })
})

// ── Events ────────────────────────────────────────────────────────────────────
app.post("/cases/:id/events", async (c) => {
  const caseId = c.req.param("id")
  const body = await c.req.json<{ event_type: string; content: string; created_by?: string }>()
  const id = uid()
  await c.env.DISPUTE_DB.prepare(`
    INSERT INTO dispute_event (id, dispute_case_id, event_type, content, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, caseId, body.event_type, body.content, body.created_by ?? null).run()
  return c.json({ id }, 201)
})

// ── Evidence Snapshots ────────────────────────────────────────────────────────
app.post("/cases/:id/snapshots", async (c) => {
  const caseId = c.req.param("id")
  const body = await c.req.json<{ snapshot_json: string; generated_by?: string }>()
  const id = uid()

  await c.env.DISPUTE_DB.prepare(`
    INSERT INTO evidence_snapshot (id, dispute_case_id, snapshot_json, generated_by)
    VALUES (?, ?, ?, ?)
  `).bind(id, caseId, body.snapshot_json, body.generated_by ?? null).run()

  await c.env.DISPUTE_DB.prepare(`
    INSERT INTO dispute_event (id, dispute_case_id, event_type, content, created_by)
    VALUES (?, ?, 'evidence_snapshot', ?, ?)
  `).bind(uid(), caseId, `Evidence snapshot generated (id: ${id})`, body.generated_by ?? null).run()

  return c.json({ id }, 201)
})

app.get("/cases/:id/snapshots/:snapId", async (c) => {
  const { id: caseId, snapId } = c.req.param()
  const row = await c.env.DISPUTE_DB.prepare(
    "SELECT * FROM evidence_snapshot WHERE id = ? AND dispute_case_id = ?"
  ).bind(snapId, caseId).first()
  if (!row) return c.json({ error: "Not found" }, 404)
  return c.json(row)
})

// ── Seed endpoints ────────────────────────────────────────────────────────────
async function bulkInsert(
  db: D1Database,
  table: string,
  caseId: string,
  rows: Record<string, unknown>[],
  columns: string[],
): Promise<{ inserted: number; skipped: number }> {
  if (!rows.length) return { inserted: 0, skipped: 0 }

  let inserted = 0
  const batchSize = 100
  const placeholders = `(${["?", ...columns.map(() => "?")].join(", ")})`
  const colList = `(id, dispute_case_id, ${columns.join(", ")})`

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const stmts = batch.map((row) => {
      const vals = [uid(), caseId, ...columns.map((c) => row[c] ?? null)]
      return db.prepare(
        `INSERT OR IGNORE INTO ${table} ${colList} VALUES ${placeholders}`
      ).bind(...vals)
    })
    const results = await db.batch(stmts)
    inserted += results.reduce((s, r) => s + (r.meta?.changes ?? 0), 0)
  }

  return { inserted, skipped: rows.length - inserted }
}

app.post("/cases/:id/seed/login-events", async (c) => {
  const caseId = c.req.param("id")
  const body = await c.req.json<{ rows: Record<string, unknown>[]; seeded_by?: string }>()
  const { inserted, skipped } = await bulkInsert(
    c.env.DISPUTE_DB, "seeded_login_event", caseId, body.rows,
    ["user_id", "email_attempted", "ip_address", "user_agent", "success", "created_at"],
  )
  await c.env.DISPUTE_DB.prepare(`
    INSERT INTO dispute_event (id, dispute_case_id, event_type, content, created_by)
    VALUES (?, ?, 'seed_import', ?, ?)
  `).bind(uid(), caseId, `Seeded ${inserted} login events (${skipped} skipped/duplicate)`, body.seeded_by ?? null).run()
  return c.json({ inserted, skipped })
})

app.post("/cases/:id/seed/api-requests", async (c) => {
  const caseId = c.req.param("id")
  const body = await c.req.json<{ rows: Record<string, unknown>[]; seeded_by?: string }>()
  const { inserted, skipped } = await bulkInsert(
    c.env.DISPUTE_DB, "seeded_api_request", caseId, body.rows,
    ["user_id", "api_key_prefix", "ip_address", "user_agent", "endpoint", "status_code", "created_at"],
  )
  await c.env.DISPUTE_DB.prepare(`
    INSERT INTO dispute_event (id, dispute_case_id, event_type, content, created_by)
    VALUES (?, ?, 'seed_import', ?, ?)
  `).bind(uid(), caseId, `Seeded ${inserted} API request logs (${skipped} skipped/duplicate)`, body.seeded_by ?? null).run()
  return c.json({ inserted, skipped })
})

app.post("/cases/:id/seed/llm-usage", async (c) => {
  const caseId = c.req.param("id")
  const body = await c.req.json<{ rows: Record<string, unknown>[]; seeded_by?: string }>()
  const { inserted, skipped } = await bulkInsert(
    c.env.DISPUTE_DB, "seeded_llm_usage", caseId, body.rows,
    ["user_id", "model_name", "source", "input_tokens", "output_tokens", "total_cost", "created_at"],
  )
  await c.env.DISPUTE_DB.prepare(`
    INSERT INTO dispute_event (id, dispute_case_id, event_type, content, created_by)
    VALUES (?, ?, 'seed_import', ?, ?)
  `).bind(uid(), caseId, `Seeded ${inserted} LLM usage records (${skipped} skipped/duplicate)`, body.seeded_by ?? null).run()
  return c.json({ inserted, skipped })
})

app.get("/cases/:id/seed/summary", async (c) => {
  const id = c.req.param("id")
  const summary = await c.env.DISPUTE_DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM seeded_login_event  WHERE dispute_case_id = ?) AS login_event_count,
      (SELECT MIN(created_at) FROM seeded_login_event WHERE dispute_case_id = ?) AS login_first_at,
      (SELECT MAX(created_at) FROM seeded_login_event WHERE dispute_case_id = ?) AS login_last_at,
      (SELECT COUNT(*) FROM seeded_api_request   WHERE dispute_case_id = ?) AS api_request_count,
      (SELECT MIN(created_at) FROM seeded_api_request WHERE dispute_case_id = ?) AS api_first_at,
      (SELECT MAX(created_at) FROM seeded_api_request WHERE dispute_case_id = ?) AS api_last_at,
      (SELECT COUNT(*) FROM seeded_llm_usage     WHERE dispute_case_id = ?) AS llm_usage_count,
      (SELECT SUM(total_cost) FROM seeded_llm_usage WHERE dispute_case_id = ?) AS llm_total_cost,
      (SELECT SUM(input_tokens + output_tokens) FROM seeded_llm_usage WHERE dispute_case_id = ?) AS llm_total_tokens
  `).bind(id, id, id, id, id, id, id, id, id).first()
  return c.json(summary)
})

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", async (c) => {
  // bypass auth for health check
  return c.json({ ok: true, ts: now() })
})

export default app
