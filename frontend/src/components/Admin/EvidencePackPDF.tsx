import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"

// Re-use the same EvidenceData shape from UserEvidencePanel
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
  login_logs: Array<{
    ip_address: string | null
    user_agent: string | null
    success: boolean
    created_at: string
  }>
  api_keys: Array<{
    name: string
    key_prefix: string
    request_count: number
    last_used_at: string | null
    last_ip: string | null
    is_active: boolean
    created_at: string
  }>
  api_request_log_sample: Array<{
    api_key_prefix: string | null
    ip_address: string | null
    endpoint: string | null
    status_code: number | null
    created_at: string
  }>
  llm_total_requests: number
  llm_total_cost_usd: number
  llm_period_days: number
  stripe_charges: Array<{
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
  }>
  stripe_invoices: Array<{
    number: string | null
    amount_paid_usd: number
    status: string
    period_start: string
    period_end: string
  }>
  stripe_subscriptions: Array<{
    id: string
    status: string
    current_period_start: string
    current_period_end: string
    canceled_at: string | null
  }>
  generated_at: string
  generated_by: string
}

const C = {
  brand: "#1a1a2e",
  accent: "#4f46e5",
  success: "#16a34a",
  danger: "#dc2626",
  muted: "#6b7280",
  border: "#e5e7eb",
  bg: "#f9fafb",
}

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 8, color: "#111", padding: 36, backgroundColor: "#fff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: C.accent },
  headerLeft: { flex: 1 },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.brand },
  subtitle: { fontSize: 8, color: C.muted, marginTop: 2 },
  meta: { fontSize: 7, color: C.muted, textAlign: "right" },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.accent, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: C.border },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  cell: { width: "48%", backgroundColor: C.bg, borderRadius: 3, padding: 6, marginBottom: 4 },
  cellLabel: { fontSize: 6, color: C.muted, marginBottom: 2, textTransform: "uppercase" },
  cellValue: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#111" },
  table: { borderWidth: 1, borderColor: C.border, borderRadius: 3 },
  thead: { flexDirection: "row", backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.border },
  th: { flex: 1, padding: "4 5", fontSize: 6, fontFamily: "Helvetica-Bold", color: C.muted, textTransform: "uppercase" },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border },
  trLast: { flexDirection: "row" },
  td: { flex: 1, padding: "4 5", fontSize: 7, color: "#111" },
  badge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, fontSize: 6, fontFamily: "Helvetica-Bold" },
  badgeGreen: { backgroundColor: "#dcfce7", color: C.success },
  badgeRed: { backgroundColor: "#fee2e2", color: C.danger },
  badgeGray: { backgroundColor: "#f3f4f6", color: C.muted },
  narrativeBox: { backgroundColor: "#eff6ff", borderLeftWidth: 3, borderLeftColor: C.accent, padding: 10, borderRadius: 3, marginBottom: 8 },
  narrativeText: { fontSize: 8, lineHeight: 1.6, color: "#1e3a5f" },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6 },
  footerText: { fontSize: 6, color: C.muted },
})

function fmt(ts: string | null | undefined) {
  if (!ts) return "—"
  return new Date(ts).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

function usd(v: number) { return `$${v.toFixed(2)}` }

function KV({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.cell}>
      <Text style={s.cellLabel}>{label}</Text>
      <Text style={s.cellValue}>{value}</Text>
    </View>
  )
}

function Badge({ v, yes, no }: { v: string | null; yes?: string; no?: string }) {
  const isGood = v === "pass" || v === "active" || v === "succeeded" || v === "paid" || v === yes
  const isBad = v === no || v === "failed" || v === "unchecked"
  const style = isGood ? s.badgeGreen : isBad ? s.badgeRed : s.badgeGray
  return <Text style={[s.badge, style]}>{v ?? "—"}</Text>
}

export function EvidencePackPDF({ data }: { data: EvidenceData }) {
  const loginCount = data.login_logs.length
  const successLogins = data.login_logs.filter((l) => l.success).length
  const dayRange = data.llm_period_days

  const narrative =
    `Account "${data.email}" was created on ${fmt(data.created_at)} from IP ${data.signup_ip ?? "unknown"}. ` +
    `Terms of Service accepted: ${fmt(data.tos_accepted_at)}. ` +
    `Email verified: ${fmt(data.email_verified_at)}. ` +
    `The account was accessed ${successLogins} times (of ${loginCount} attempts recorded). ` +
    `Over the past ${dayRange} days, ${data.llm_total_requests.toLocaleString()} API requests were made, ` +
    `consuming a total computed value of ${usd(data.llm_total_cost_usd)} in AI compute. ` +
    (data.stripe_charges.length > 0
      ? `Most recent charge: ${usd(data.stripe_charges[0].amount_usd)} ${data.stripe_charges[0].currency} — ` +
        `CVV: ${data.stripe_charges[0].cvv_check ?? "N/A"}, AVS ZIP: ${data.stripe_charges[0].address_postal_check ?? "N/A"}, ` +
        `Stripe Radar score: ${data.stripe_charges[0].risk_score ?? "N/A"} (${data.stripe_charges[0].risk_level ?? "N/A"}).`
      : "No Stripe charges found in this period.")

  return (
    <Document title={`Evidence Pack — ${data.email}`} author="ROAMINGPROXY.com">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.brand}>ROAMINGPROXY.COM</Text>
            <Text style={s.subtitle}>Dispute Evidence Pack — Confidential</Text>
          </View>
          <View>
            <Text style={s.meta}>Generated: {fmt(data.generated_at)}</Text>
            <Text style={s.meta}>By: {data.generated_by}</Text>
          </View>
        </View>

        {/* Fraud Defense Narrative */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Fraud Defense Summary</Text>
          <View style={s.narrativeBox}>
            <Text style={s.narrativeText}>{narrative}</Text>
          </View>
        </View>

        {/* Account Identity */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Account Identity</Text>
          <View style={s.grid}>
            <KV label="User ID" value={data.user_id} />
            <KV label="Email" value={data.email} />
            <KV label="Full Name" value={data.full_name ?? "—"} />
            <KV label="Account Created" value={fmt(data.created_at)} />
            <KV label="Signup IP" value={data.signup_ip ?? "—"} />
            <KV label="ToS Accepted At" value={fmt(data.tos_accepted_at)} />
            <KV label="Email Verified At" value={fmt(data.email_verified_at)} />
            <KV label="Stripe Customer ID" value={data.stripe_customer_id ?? "—"} />
          </View>
        </View>

        {/* Login History */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Login History (last {loginCount})</Text>
          <View style={s.table}>
            <View style={s.thead}>
              <Text style={[s.th, { flex: 2 }]}>Date / Time</Text>
              <Text style={s.th}>IP Address</Text>
              <Text style={[s.th, { flex: 3 }]}>User Agent</Text>
              <Text style={s.th}>Result</Text>
            </View>
            {data.login_logs.slice(0, 30).map((r, i) => (
              <View key={i} style={i < data.login_logs.slice(0, 30).length - 1 ? s.tr : s.trLast}>
                <Text style={[s.td, { flex: 2 }]}>{fmt(r.created_at)}</Text>
                <Text style={s.td}>{r.ip_address ?? "—"}</Text>
                <Text style={[s.td, { flex: 3 }]}>{(r.user_agent ?? "—").slice(0, 60)}</Text>
                <Text style={s.td}><Badge v={r.success ? "pass" : "failed"} yes="pass" no="failed" /></Text>
              </View>
            ))}
          </View>
        </View>

        {/* API Usage */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>API Key Usage</Text>
          <View style={s.table}>
            <View style={s.thead}>
              <Text style={[s.th, { flex: 2 }]}>Name</Text>
              <Text style={s.th}>Prefix</Text>
              <Text style={s.th}>Requests</Text>
              <Text style={[s.th, { flex: 2 }]}>Last Used</Text>
              <Text style={s.th}>Last IP</Text>
              <Text style={s.th}>Status</Text>
            </View>
            {data.api_keys.map((k, i) => (
              <View key={i} style={i < data.api_keys.length - 1 ? s.tr : s.trLast}>
                <Text style={[s.td, { flex: 2 }]}>{k.name}</Text>
                <Text style={s.td}>{k.key_prefix}</Text>
                <Text style={s.td}>{k.request_count.toLocaleString()}</Text>
                <Text style={[s.td, { flex: 2 }]}>{fmt(k.last_used_at)}</Text>
                <Text style={s.td}>{k.last_ip ?? "—"}</Text>
                <Text style={s.td}><Badge v={k.is_active ? "active" : "disabled"} yes="active" /></Text>
              </View>
            ))}
          </View>
        </View>

        {/* LLM Usage Summary */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Compute Usage Summary ({dayRange}-day period)</Text>
          <View style={s.grid}>
            <KV label="Total API Requests" value={data.llm_total_requests.toLocaleString()} />
            <KV label="Total Compute Cost" value={usd(data.llm_total_cost_usd)} />
          </View>
        </View>

        {/* Stripe Charges */}
        {data.stripe_charges.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Stripe Charges & Fraud Signals</Text>
            <View style={s.table}>
              <View style={s.thead}>
                <Text style={[s.th, { flex: 2 }]}>Date</Text>
                <Text style={s.th}>Amount</Text>
                <Text style={s.th}>Status</Text>
                <Text style={s.th}>CVV</Text>
                <Text style={s.th}>AVS ZIP</Text>
                <Text style={[s.th, { flex: 2 }]}>Radar Score</Text>
                <Text style={[s.th, { flex: 2 }]}>Billing Name</Text>
              </View>
              {data.stripe_charges.map((ch, i) => (
                <View key={i} style={i < data.stripe_charges.length - 1 ? s.tr : s.trLast}>
                  <Text style={[s.td, { flex: 2 }]}>{fmt(ch.created_at)}</Text>
                  <Text style={s.td}>{usd(ch.amount_usd)}</Text>
                  <Text style={s.td}><Badge v={ch.status} yes="succeeded" /></Text>
                  <Text style={s.td}><Badge v={ch.cvv_check} yes="pass" no="fail" /></Text>
                  <Text style={s.td}><Badge v={ch.address_postal_check} yes="pass" no="fail" /></Text>
                  <Text style={[s.td, { flex: 2 }]}>{ch.risk_score != null ? `${ch.risk_score}/100 (${ch.risk_level})` : "—"}</Text>
                  <Text style={[s.td, { flex: 2 }]}>{ch.billing_name ?? "—"}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Invoices */}
        {data.stripe_invoices.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Stripe Invoices (Service Delivery Proof)</Text>
            <View style={s.table}>
              <View style={s.thead}>
                <Text style={s.th}>Invoice #</Text>
                <Text style={s.th}>Amount</Text>
                <Text style={s.th}>Status</Text>
                <Text style={[s.th, { flex: 2 }]}>Period Start</Text>
                <Text style={[s.th, { flex: 2 }]}>Period End</Text>
              </View>
              {data.stripe_invoices.map((inv, i) => (
                <View key={i} style={i < data.stripe_invoices.length - 1 ? s.tr : s.trLast}>
                  <Text style={s.td}>{inv.number ?? "—"}</Text>
                  <Text style={s.td}>{usd(inv.amount_paid_usd)}</Text>
                  <Text style={s.td}><Badge v={inv.status} yes="paid" /></Text>
                  <Text style={[s.td, { flex: 2 }]}>{fmt(inv.period_start)}</Text>
                  <Text style={[s.td, { flex: 2 }]}>{fmt(inv.period_end)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>ROAMINGPROXY.COM — Dispute Evidence Pack — {data.email}</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
