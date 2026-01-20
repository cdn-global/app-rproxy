import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import PageScaffold, { PageSection } from "@/components/Common/PageLayout"

const SettingsPage = () => {
  const [checkboxChecked, setCheckboxChecked] = useState(true)
  const [selectedEnvironment, setSelectedEnvironment] = useState("production")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const analyticsPoints = [38, 62, 54, 78, 92, 66, 105, 98]
  const sparkPath = analyticsPoints
    .map((point, index) => {
      const x = (index / (analyticsPoints.length - 1)) * 180
      const y = 110 - point
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(" ")

  return (
    <PageScaffold className="py-8" sidebar={null}>
      <div className="space-y-6">
        <div className="mx-auto w-full max-w-4xl space-y-4 text-center">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Settings</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">A dev-facing page that surfaces UI components and states — useful for visual checks and QA.</p>
        </div>

        <PageSection id="feedback" title="Feedback & status" description="Alert, badge, and button styling checks with live spinner feedback.">
          <div className="space-y-5 rounded-[24px] border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-4 py-4 text-slate-900 dark:text-slate-50">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-indigo-700 dark:text-indigo-200">Current posture</p>
                <p className="mt-1 text-2xl font-semibold">All systems nominal</p>
                <p className="text-xs text-slate-700 dark:text-slate-300">9h 12m since last incident · 100% regional availability</p>
              </div>
              <Button size="sm" className="rounded-full px-4">View status page</Button>
            </div>
            <div className="border border-emerald-400/40 bg-emerald-500/10 text-emerald-700 p-3 rounded">
              <strong>All systems operational</strong>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Primary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="secondary">Secondary</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" className="rounded-full px-4">Primary CTA</Button>
              <Button size="sm" variant="outline" className="rounded-full px-4">Outline CTA</Button>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><Spinner size={18} /><span>Polling usage...</span></div>
            </div>
          </div>
        </PageSection>

        <PageSection id="forms" title="Form controls" description="Validate input, textarea, and checkbox treatments side-by-side.">
          <div className="space-y-4 rounded-[24px] border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
            <div className="space-y-2">
              <Label htmlFor="gallery-email">Contact email</Label>
              <Input id="gallery-email" type="email" placeholder="ops@roamingproxy.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gallery-notes">Internal note</Label>
              <Textarea id="gallery-notes" placeholder="Document crawl windows, axial rotation, or cache notes." rows={3} />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Checkbox id="gallery-checkbox" checked={checkboxChecked} onCheckedChange={(value) => setCheckboxChecked(Boolean(value))} />
              <Label htmlFor="gallery-checkbox" className="text-sm font-medium">Enable automatic IP rotation</Label>
            </div>
          </div>
        </PageSection>

        <PageSection id="analytics" title="Analytics & charts" description="Metric cards, sparkline trends, and breakdown tags for throughput reviews.">
          <div className="space-y-5 rounded-[24px] border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border p-5 text-slate-900 dark:text-slate-50">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">Requests</div>
                <div className="mt-2 text-2xl font-semibold">4.8M</div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">+12.4% vs last 7 days</p>
                <div className="mt-4">
                  <svg viewBox="0 0 180 110" className="h-24 w-full"><path d={`${sparkPath} L 180 110 L 0 110 Z`} fill="rgba(14,165,233,0.16)" className="stroke-none" /><path d={sparkPath} stroke="rgba(56,189,248,0.9)" strokeWidth={3} fill="none" strokeLinecap="round" /></svg>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 rounded-2xl border p-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Network mix</p>
                  <div className="mt-2 flex items-baseline gap-2 text-2xl font-semibold">64%<span className="text-xs font-medium text-emerald-500">target proximity</span></div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-600"><span>Datacenter</span><Badge className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-emerald-700">42%</Badge></div>
                  <div className="flex items-center justify-between text-sm text-slate-600"><span>Residential</span><Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em]">38%</Badge></div>
                  <div className="flex items-center justify-between text-sm text-slate-600"><span>ISP</span><Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em]">20%</Badge></div>
                </div>
              </div>
            </div>
          </div>
        </PageSection>

        <PageSection id="menus" title="Menus, overlays & data" description="Dropdowns, tooltips, dialogs, and table styling bundled for quick visual regression.">
          <div className="space-y-6 rounded-[24px] border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tooltip</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-full px-4">Hover for status</Button>
                    </TooltipTrigger>
                    <TooltipContent>All proxy regions within SLA</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Dropdown menu</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full px-4">{selectedEnvironment === "production" ? "Production" : "Staging"}</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    <DropdownMenuLabel>Choose environment</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
                      <DropdownMenuRadioItem value="production">Production</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="staging">Staging</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Manage environments</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Dialog</p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full px-4">Open preview</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                      <DialogTitle>Rotate credentials?</DialogTitle>
                      <DialogDescription>Confirm to roll proxy credentials across all active regions.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 text-sm text-slate-600">You can download the new key from the API console once generated.</div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                      <Button onClick={() => setIsDialogOpen(false)} className="gap-2">Rotate now</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white/80">
              <Table className="min-w-[480px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Node</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Latency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">nyc-edge-01</TableCell>
                    <TableCell>
                      <Badge className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-emerald-700">Connected</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-slate-600">82 ms</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">fra-edge-04</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em]">Draining</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-slate-600">104 ms</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">sfo-edge-07</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em]">Pending</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-slate-600">96 ms</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </PageSection>
      </div>
    </PageScaffold>
  )
}

export const Route = createFileRoute("/_layout/settings")({ component: SettingsPage })
export default SettingsPage
