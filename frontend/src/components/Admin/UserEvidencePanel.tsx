import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

interface UserEvidencePanelProps {
  user: UserPublic
  isOpen: boolean
  onClose: () => void
}

interface EvidenceData {
  user_id: string
  email: string
  full_name: string | null
  created_at: string | null
  signup_ip: string | null
  tos_accepted_at: string | null
  email_verified_at: string | null
  is_active: boolean
  is_deactivated: boolean
  has_subscription: boolean
  stripe_customer_id: string | null
  login_logs: LoginEntry[]
  api_keys: ApiKeyEntry[]
  api_request_log_sample: RequestEntry[]
  llm_total_requests: number
  llm_total_cost_usd: number
  llm_period_days: number
  stripe_charges: StripeCharge[]
  stripe_invoices: StripeInvoice[]
  stripe_subscriptions: StripeSub[]
  generated_at: string
  generated_by: string
}

interface LoginEntry {
  id: string
  email_attempted: string
  ip_address: string | null
  user_agent: string | null
  success: boolean
  created_at: string
}

interface ApiKeyEntry {
  id: string
  name: string
  key_prefix: string
  request_count: number
  last_used_at: string | null
  last_ip: string | null
  is_active: boolean
  created_at: string
}

interface RequestEntry {
  id: string
  api_key_prefix: string | null
  ip_address: string | null
  endpoint: string | null
  status_code: number | null
  created_at: string
}

interface StripeCharge {
  id: string
  amount_usd: number
  currency: string
  status: string
  created_at: string
  billing_name: string | null
  risk_level: string | null
  risk_score: number | null
  cvv_check: string | null
  address_postal_check: string | null
}

interface StripeInvoice {
  id: string
  number: string | null
  amount_paid_usd: number
  status: string
  period_start: string
  period_end: string
  invoice_pdf: string | null
}

interface StripeSub {
  id: string
  status: string
  current_period_start: string
  current_period_end: string
  canceled_at: string | null
}

function fmt(ts: string | null | undefined): string {
  if (!ts) return "—"
  return new Date(ts).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  })
}

function usd(v: number) {
  return `$${v.toFixed(4)}`
}

const API_BASE = import.meta.env.DEV ? "" : "https://api.roamingproxy.com"

export default function UserEvidencePanel({ user, isOpen, onClose }: UserEvidencePanelProps) {
  const [data, setData] = useState<EvidenceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  const fetchEvidence = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("access_token")
      const res = await fetch(`${API_BASE}/v2/admin/disputes/evidence/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      setData(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load evidence")
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    if (isOpen) fetchEvidence()
    else { setData(null); setError(null) }
  }, [isOpen, fetchEvidence])

  const handleDownloadPDF = async () => {
    if (!data) return
    setPdfLoading(true)
    try {
      const { pdf } = await import("@react-pdf/renderer")
      const { EvidencePackPDF } = await import("./EvidencePackPDF")
      const blob = await pdf(<EvidencePackPDF data={data} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `evidence-${data.email}-${new Date().toISOString().slice(0, 10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("PDF generation failed. Make sure @react-pdf/renderer is installed.")
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Evidence Pack — {user.email}
            </DialogTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={!data || pdfLoading}
              className="gap-2"
            >
              {pdfLoading ? <Spinner size={14} /> : null}
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        {loading && (
          <div className="flex h-48 items-center justify-center">
            <Spinner size={32} />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {data && (
          <Tabs defaultValue="overview" className="mt-2">
            <TabsList className="flex flex-wrap gap-1 h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="logins">
                Logins <Badge variant="outline" className="ml-1">{data.login_logs.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="apikeys">
                API Keys <Badge variant="outline" className="ml-1">{data.api_keys.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="requests">
                Requests <Badge variant="outline" className="ml-1">{data.api_request_log_sample.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="usage">LLM Usage</TabsTrigger>
              <TabsTrigger value="billing">
                Billing <Badge variant="outline" className="ml-1">{data.stripe_invoices.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="charges">
                Charges <Badge variant="outline" className="ml-1">{data.stripe_charges.length}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* ── Overview ──────────────────────────────────────────────── */}
            <TabsContent value="overview" className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["User ID", data.user_id],
                  ["Email", data.email],
                  ["Full Name", data.full_name ?? "—"],
                  ["Account Created", fmt(data.created_at)],
                  ["Signup IP", data.signup_ip ?? "—"],
                  ["ToS Accepted At", fmt(data.tos_accepted_at)],
                  ["Email Verified At", fmt(data.email_verified_at)],
                  ["Stripe Customer ID", data.stripe_customer_id ?? "—"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">{k}</div>
                    <div className="mt-1 font-mono text-xs break-all">{v}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant={data.is_active ? "success" : "destructive"}>
                  {data.is_active ? "Active" : "Inactive"}
                </Badge>
                {data.is_deactivated && <Badge variant="destructive">Deactivated</Badge>}
                {data.has_subscription && <Badge variant="success">Subscribed</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                Generated {fmt(data.generated_at)} by {data.generated_by}
              </p>
            </TabsContent>

            {/* ── Login History ─────────────────────────────────────────── */}
            <TabsContent value="logins" className="mt-4">
              <div className="overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date / Time</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>User Agent</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.login_logs.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No login records yet</TableCell></TableRow>
                    ) : data.login_logs.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs whitespace-nowrap">{fmt(r.created_at)}</TableCell>
                        <TableCell className="font-mono text-xs">{r.ip_address ?? "—"}</TableCell>
                        <TableCell className="text-xs max-w-xs truncate" title={r.user_agent ?? ""}>{r.user_agent ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={r.success ? "success" : "destructive"}>
                            {r.success ? "Success" : "Failed"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* ── API Keys ─────────────────────────────────────────────── */}
            <TabsContent value="apikeys" className="mt-4">
              <div className="overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Prefix</TableHead>
                      <TableHead>Requests</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Last IP</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.api_keys.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No API keys</TableCell></TableRow>
                    ) : data.api_keys.map((k) => (
                      <TableRow key={k.id}>
                        <TableCell className="text-sm">{k.name}</TableCell>
                        <TableCell className="font-mono text-xs">{k.key_prefix}</TableCell>
                        <TableCell className="font-mono text-xs">{k.request_count.toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">{fmt(k.last_used_at)}</TableCell>
                        <TableCell className="font-mono text-xs">{k.last_ip ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">{fmt(k.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant={k.is_active ? "success" : "destructive"}>
                            {k.is_active ? "Active" : "Disabled"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* ── Request Log ──────────────────────────────────────────── */}
            <TabsContent value="requests" className="mt-4">
              <div className="overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date / Time</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Key Prefix</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.api_request_log_sample.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No request logs yet</TableCell></TableRow>
                    ) : data.api_request_log_sample.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs whitespace-nowrap">{fmt(r.created_at)}</TableCell>
                        <TableCell className="font-mono text-xs">{r.ip_address ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{r.api_key_prefix ?? "—"}</TableCell>
                        <TableCell className="text-xs max-w-xs truncate">{r.endpoint ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={(r.status_code ?? 0) < 400 ? "success" : "destructive"}>
                            {r.status_code ?? "—"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* ── LLM Usage ────────────────────────────────────────────── */}
            <TabsContent value="usage" className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["Total Requests", data.llm_total_requests.toLocaleString()],
                  ["Total Cost", usd(data.llm_total_cost_usd)],
                  ["Period", `${data.llm_period_days} days`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border p-4 text-center">
                    <div className="text-2xl font-semibold">{v}</div>
                    <div className="text-xs text-muted-foreground mt-1">{k}</div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* ── Billing ──────────────────────────────────────────────── */}
            <TabsContent value="billing" className="mt-4 space-y-4">
              {data.stripe_subscriptions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Subscriptions</p>
                  <div className="overflow-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Period Start</TableHead>
                          <TableHead>Period End</TableHead>
                          <TableHead>Cancelled</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.stripe_subscriptions.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-mono text-xs">{s.id}</TableCell>
                            <TableCell><Badge variant={s.status === "active" ? "success" : "outline"}>{s.status}</Badge></TableCell>
                            <TableCell className="font-mono text-xs whitespace-nowrap">{fmt(s.current_period_start)}</TableCell>
                            <TableCell className="font-mono text-xs whitespace-nowrap">{fmt(s.current_period_end)}</TableCell>
                            <TableCell className="font-mono text-xs">{s.canceled_at ? fmt(s.canceled_at) : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Invoices</p>
                <div className="overflow-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>PDF</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.stripe_invoices.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No invoices</TableCell></TableRow>
                      ) : data.stripe_invoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-xs">{inv.number ?? inv.id}</TableCell>
                          <TableCell className="font-mono text-xs">{usd(inv.amount_paid_usd)}</TableCell>
                          <TableCell><Badge variant={inv.status === "paid" ? "success" : "outline"}>{inv.status}</Badge></TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{fmt(inv.period_start)} → {fmt(inv.period_end)}</TableCell>
                          <TableCell>
                            {inv.invoice_pdf ? (
                              <a href={inv.invoice_pdf} target="_blank" rel="noreferrer" className="text-xs underline">
                                Download
                              </a>
                            ) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* ── Charges ──────────────────────────────────────────────── */}
            <TabsContent value="charges" className="mt-4">
              <div className="overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>CVV</TableHead>
                      <TableHead>AVS ZIP</TableHead>
                      <TableHead>Radar</TableHead>
                      <TableHead>Billing Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.stripe_charges.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No charges</TableCell></TableRow>
                    ) : data.stripe_charges.map((ch) => (
                      <TableRow key={ch.id}>
                        <TableCell className="font-mono text-xs whitespace-nowrap">{fmt(ch.created_at)}</TableCell>
                        <TableCell className="font-mono text-xs">{usd(ch.amount_usd)} {ch.currency}</TableCell>
                        <TableCell><Badge variant={ch.status === "succeeded" ? "success" : "destructive"}>{ch.status}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={ch.cvv_check === "pass" ? "success" : "outline"}>
                            {ch.cvv_check ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ch.address_postal_check === "pass" ? "success" : "outline"}>
                            {ch.address_postal_check ?? "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {ch.risk_score != null ? `${ch.risk_score} (${ch.risk_level})` : "—"}
                        </TableCell>
                        <TableCell className="text-xs">{ch.billing_name ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
