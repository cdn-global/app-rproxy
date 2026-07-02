import { useState, useEffect, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import type { UserPublic } from "../../client"
import UserEvidencePanel from "./UserEvidencePanel"

const API_BASE = import.meta.env.DEV ? "" : "https://api.roamingproxy.com"

function authHeaders() {
  const token = localStorage.getItem("access_token")
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
}

interface DisputeCase {
  id: string
  user_id: string | null
  user_email: string
  user_full_name: string | null
  stripe_charge_id: string | null
  stripe_dispute_id: string | null
  reason: string
  status: string
  disputed_amount_usd: number
  currency: string
  response_due_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  event_count: number
  snapshot_count: number
}

interface DisputeEvent {
  id: string
  event_type: string
  content: string
  created_at: string
  created_by: string | null
}

interface CaseDetail extends DisputeCase {
  events: DisputeEvent[]
  snapshots: Array<{ id: string; generated_at: string; generated_by: string }>
  seed_summary: {
    login_event_count: number
    login_first_at: string | null
    login_last_at: string | null
    api_request_count: number
    api_first_at: string | null
    api_last_at: string | null
    llm_usage_count: number
    llm_total_cost: number | null
    llm_total_tokens: number | null
  } | null
}

function fmt(ts: string | null | undefined) {
  if (!ts) return "—"
  return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

const STATUS_COLORS: Record<string, "default" | "success" | "destructive" | "outline"> = {
  open: "default",
  under_review: "outline",
  won: "success",
  lost: "destructive",
  withdrawn: "outline",
}

// ── New Case Form ─────────────────────────────────────────────────────────────

function NewCaseModal({ isOpen, onClose, onCreated }: {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    user_email: "",
    stripe_charge_id: "",
    reason: "fraud",
    disputed_amount_usd: "",
    response_due_date: "",
    notes: "",
  })

  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/v2/admin/disputes/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ...form,
          disputed_amount_usd: parseFloat(form.disputed_amount_usd) || 0,
          created_by: currentUser?.email,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      onCreated()
      onClose()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create case")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Open New Dispute Case</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label>Customer Email *</Label>
            <Input required value={form.user_email} onChange={(e) => setForm({ ...form, user_email: e.target.value })} placeholder="customer@example.com" />
          </div>
          <div className="space-y-1">
            <Label>Stripe Charge ID</Label>
            <Input value={form.stripe_charge_id} onChange={(e) => setForm({ ...form, stripe_charge_id: e.target.value })} placeholder="ch_..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Dispute Reason</Label>
              <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["fraud", "not_received", "duplicate", "subscription_cancelled", "other"].map((r) => (
                    <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Disputed Amount (USD)</Label>
              <Input type="number" step="0.01" value={form.disputed_amount_usd} onChange={(e) => setForm({ ...form, disputed_amount_usd: e.target.value })} placeholder="49.99" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Response Due Date</Label>
            <Input type="date" value={form.response_due_date} onChange={(e) => setForm({ ...form, response_due_date: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Context about this dispute..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create Case"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Case Detail ───────────────────────────────────────────────────────────────

function CaseDetailModal({ caseId, isOpen, onClose }: { caseId: string; isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const [detail, setDetail] = useState<CaseDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState("")
  const [seedType, setSeedType] = useState<"login-events" | "api-requests" | "llm-usage">("login-events")
  const [seedJson, setSeedJson] = useState("")
  const [seeding, setSeeding] = useState(false)
  const [stripeCustomerId, setStripeCustomerId] = useState("")
  const [seedingStripe, setSeedingStripe] = useState(false)
  const [snapshotting, setSnapshotting] = useState(false)
  const [userId, setUserId] = useState("")
  const [evidenceUser, setEvidenceUser] = useState<UserPublic | null>(null)
  const [statusSaving, setStatusSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/v2/admin/disputes/${caseId}`, { headers: authHeaders() })
      if (!res.ok) throw new Error(await res.text())
      const data: CaseDetail = await res.json()
      setDetail(data)
      // Pre-fill Stripe customer ID and user_id from case
      if (data.user_id) setUserId(data.user_id)
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => { if (isOpen) load() }, [isOpen, load])

  const changeStatus = async (newStatus: string) => {
    setStatusSaving(true)
    try {
      const res = await fetch(`${API_BASE}/v2/admin/disputes/${caseId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus, updated_by: currentUser?.email }),
      })
      if (!res.ok) throw new Error(await res.text())
      load()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status")
    } finally {
      setStatusSaving(false)
    }
  }

  const addNote = async () => {
    if (!note.trim()) return
    await fetch(`${API_BASE}/v2/admin/disputes/${caseId}/events`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ event_type: "note", content: note, created_by: currentUser?.email }),
    })
    setNote("")
    load()
  }

  const seedFromStripe = async () => {
    if (!stripeCustomerId.trim()) return
    setSeedingStripe(true)
    try {
      const res = await fetch(`${API_BASE}/v2/admin/disputes/${caseId}/seed/from-stripe`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          stripe_customer_id: stripeCustomerId.trim(),
          user_id: userId || undefined,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.detail || "Stripe seed failed")
      alert(`Seeded from Stripe: ${result.summary?.join(", ") || "no data"}`)
      load()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Stripe seed failed")
    } finally {
      setSeedingStripe(false)
    }
  }

  const seedData = async () => {
    setSeeding(true)
    try {
      const rows = JSON.parse(seedJson)
      const res = await fetch(`${API_BASE}/v2/admin/disputes/${caseId}/seed/${seedType}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ rows, seeded_by: currentUser?.email }),
      })
      const result = await res.json()
      alert(`Inserted: ${result.inserted}, Skipped: ${result.skipped}`)
      setSeedJson("")
      load()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Seed failed — check JSON format")
    } finally {
      setSeeding(false)
    }
  }

  const generateSnapshot = async () => {
    setSnapshotting(true)
    try {
      const params = userId ? `?user_id=${userId}` : ""
      const res = await fetch(`${API_BASE}/v2/admin/disputes/${caseId}/snapshot${params}`, {
        method: "POST",
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(await res.text())
      const r = await res.json()
      alert(`Snapshot saved: ${r.snapshot_id}`)
      load()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Snapshot failed")
    } finally {
      setSnapshotting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dispute Case {detail ? `— ${detail.user_email}` : ""}</DialogTitle>
        </DialogHeader>

        {loading && <div className="flex h-32 items-center justify-center"><Spinner size={28} /></div>}

        {detail && (
          <div className="space-y-6 mt-2">
            {/* Summary + actions */}
            <div className="flex items-start justify-between gap-4">
              <div className="grid grid-cols-3 gap-3 text-sm flex-1">
                {[
                  ["Customer", detail.user_email],
                  ["Reason", detail.reason.replace("_", " ")],
                  ["Status", detail.status.replace("_", " ")],
                  ["Amount", `$${detail.disputed_amount_usd.toFixed(2)} ${detail.currency}`],
                  ["Charge ID", detail.stripe_charge_id ?? "—"],
                  ["Due", fmt(detail.response_due_date)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">{k}</div>
                    <div className="mt-1 text-xs font-semibold truncate" title={String(v)}>{v}</div>
                  </div>
                ))}
              </div>
              {detail.user_id && (
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-2"
                  onClick={() => setEvidenceUser({
                    id: detail.user_id as any,
                    email: detail.user_email,
                    full_name: detail.user_full_name,
                    is_active: true,
                    is_superuser: false,
                  } as UserPublic)}
                >
                  Evidence Pack ↗
                </Button>
              )}
            </div>

            {/* Status management */}
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Label className="text-xs shrink-0">Case status:</Label>
              <Select value={detail.status} onValueChange={changeStatus} disabled={statusSaving}>
                <SelectTrigger className="w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["open", "under_review", "won", "lost", "withdrawn"].map((st) => (
                    <SelectItem key={st} value={st}>{st.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {statusSaving && <Spinner size={14} />}
              {detail.status !== "withdrawn" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto text-destructive hover:text-destructive"
                  disabled={statusSaving}
                  onClick={() => {
                    if (window.confirm("Withdraw this dispute case? It will be marked as withdrawn.")) {
                      changeStatus("withdrawn")
                    }
                  }}
                >
                  Withdraw Case
                </Button>
              )}
            </div>

            {/* Seed summary */}
            {detail.seed_summary && (
              <div className="rounded-lg border p-4 space-y-1 text-sm">
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">Seeded Historical Data</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <span>Login events: <strong>{detail.seed_summary.login_event_count}</strong></span>
                  <span>API requests: <strong>{detail.seed_summary.api_request_count}</strong></span>
                  <span>LLM rows: <strong>{detail.seed_summary.llm_usage_count}</strong> (${(detail.seed_summary.llm_total_cost ?? 0).toFixed(4)})</span>
                  {detail.seed_summary.login_first_at && <span>First login: <strong>{fmt(detail.seed_summary.login_first_at)}</strong></span>}
                  {detail.seed_summary.login_last_at && <span>Last login: <strong>{fmt(detail.seed_summary.login_last_at)}</strong></span>}
                </div>
              </div>
            )}

            {/* Evidence snapshot */}
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Evidence Snapshot</p>
              <div className="flex gap-2 items-end flex-wrap">
                <div className="space-y-1 flex-1">
                  <Label className="text-xs">User ID (optional — auto-resolved from case)</Label>
                  <Input placeholder="uuid of the user" value={userId} onChange={(e) => setUserId(e.target.value)} className="font-mono text-xs" />
                </div>
                <Button size="sm" onClick={generateSnapshot} disabled={snapshotting} className="gap-2">
                  {snapshotting ? <Spinner size={14} /> : null}
                  Generate + Save Snapshot
                </Button>
              </div>
              {detail.snapshots.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {detail.snapshots.length} snapshot(s) saved — latest: {fmt(detail.snapshots[0].generated_at)} by {detail.snapshots[0].generated_by ?? "—"}
                </div>
              )}
            </div>

            {/* Seed from Stripe */}
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-400 tracking-wide">
                Seed from Stripe (recommended)
              </p>
              <p className="text-xs text-muted-foreground">
                Pulls charges, invoice line items, and events directly from Stripe and seeds them as structured evidence — aligns with actual billed amounts.
              </p>
              <div className="flex gap-2 items-end flex-wrap">
                <div className="space-y-1 flex-1">
                  <Label className="text-xs">Stripe Customer ID</Label>
                  <Input
                    className="font-mono text-xs"
                    placeholder="cus_..."
                    value={stripeCustomerId}
                    onChange={(e) => setStripeCustomerId(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={seedFromStripe}
                  disabled={seedingStripe || !stripeCustomerId.trim()}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {seedingStripe ? <Spinner size={14} /> : null}
                  Pull from Stripe
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Maps: Stripe Charges → API request log · Invoice line items → itemized usage (with $USD cost) · Radar events → login events
              </p>
            </div>

            {/* Seed historical data */}
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Seed Historical Data</p>
              <div className="flex gap-2 items-center">
                <Label className="text-xs shrink-0">Data type:</Label>
                <Select value={seedType} onValueChange={(v) => setSeedType(v as typeof seedType)}>
                  <SelectTrigger className="w-48 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="login-events">Login Events</SelectItem>
                    <SelectItem value="api-requests">API Requests</SelectItem>
                    <SelectItem value="llm-usage">LLM Usage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">
                  Paste JSON array — e.g.{" "}
                  {seedType === "login-events" && <code className="text-[10px]">[&#123;"email_attempted":"x@y","ip_address":"1.2.3.4","user_agent":"…","success":1,"created_at":"2025-01-01T00:00:00Z"&#125;]</code>}
                  {seedType === "api-requests" && <code className="text-[10px]">[&#123;"ip_address":"1.2.3.4","endpoint":"/v2/…","status_code":200,"created_at":"2025-01-01T00:00:00Z"&#125;]</code>}
                  {seedType === "llm-usage" && <code className="text-[10px]">[&#123;"model_name":"claude-3","input_tokens":500,"output_tokens":200,"total_cost":0.002,"created_at":"2025-01-01T00:00:00Z"&#125;]</code>}
                </Label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-ring"
                  rows={5}
                  placeholder='[{"email_attempted": "...", ...}]'
                  value={seedJson}
                  onChange={(e) => setSeedJson(e.target.value)}
                />
              </div>
              <Button size="sm" onClick={seedData} disabled={seeding || !seedJson.trim()} className="gap-2">
                {seeding ? <Spinner size={14} /> : null}
                Upload Seed Data
              </Button>
            </div>

            {/* Event timeline */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Case Timeline</p>
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {detail.events.map((ev) => (
                  <div key={ev.id} className="flex gap-3 text-xs rounded-lg border p-2">
                    <span className="text-muted-foreground whitespace-nowrap">{fmt(ev.created_at)}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">{ev.event_type}</Badge>
                    <span className="text-foreground">{ev.content}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} className="text-sm" onKeyDown={(e) => e.key === "Enter" && addNote()} />
                <Button size="sm" variant="outline" onClick={addNote}>Add</Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Evidence Pack panel — opens on top of case detail */}
      {evidenceUser && (
        <UserEvidencePanel
          user={evidenceUser}
          isOpen={!!evidenceUser}
          onClose={() => setEvidenceUser(null)}
        />
      )}
    </Dialog>
  )
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export default function DisputeCasePanel() {
  const [cases, setCases] = useState<DisputeCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newCaseOpen, setNewCaseOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/v2/admin/disputes/`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      setCases(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load cases")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const importFromStripe = async () => {
    setImporting(true)
    try {
      const res = await fetch(`${API_BASE}/v2/admin/disputes/import-from-stripe`, {
        method: "POST",
        headers: authHeaders(),
      })
      const r = await res.json()
      if (!res.ok) throw new Error(r.detail || "Import failed")
      alert(
        `Imported ${r.imported} case(s). ${r.skipped} already existed. ` +
        `${r.snapshots_generated} evidence snapshot(s) generated.`,
      )
      load()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Stripe import failed")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {cases.length} dispute case{cases.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={importFromStripe} disabled={importing} className="gap-2">
            {importing ? <Spinner size={14} /> : null}
            {importing ? "Importing…" : "Import from Stripe"}
          </Button>
          <Button size="sm" onClick={() => setNewCaseOpen(true)}>Open New Case</Button>
        </div>
      </div>

      {loading && <div className="flex h-32 items-center justify-center"><Spinner size={28} /></div>}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive space-y-1">
          <p className="font-semibold">Failed to load dispute cases</p>
          <p>{error}</p>
          {error.includes("DISPUTE_WORKER_URL") && (
            <p className="mt-2 text-xs font-mono bg-destructive/10 rounded p-2">
              On your server: <strong>echo 'DISPUTE_WORKER_URL=https://dispute-worker.apis-popov.workers.dev' &gt;&gt; .env</strong><br />
              Then: <strong>docker compose --env-file .env up -d backend</strong>
            </p>
          )}
        </div>
      )}

      {!loading && !error && (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No dispute cases yet. Open one to start building an evidence pack.
                  </TableCell>
                </TableRow>
              ) : cases.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-sm">{c.user_email}</TableCell>
                  <TableCell className="text-xs capitalize">{c.reason.replace("_", " ")}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[c.status] ?? "outline"}>{c.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">${c.disputed_amount_usd.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{fmt(c.response_due_date)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.event_count}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmt(c.created_at)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => setSelectedCase(c.id)}>
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <NewCaseModal
        isOpen={newCaseOpen}
        onClose={() => setNewCaseOpen(false)}
        onCreated={load}
      />

      {selectedCase && (
        <CaseDetailModal
          caseId={selectedCase}
          isOpen={!!selectedCase}
          onClose={() => { setSelectedCase(null); load() }}
        />
      )}
    </div>
  )
}