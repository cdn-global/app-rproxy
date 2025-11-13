import { CheckCircleIcon, CopyIcon } from "@chakra-ui/icons"
import {
  Box,
  Button,
  Card,
  CardBody,
  import { useCallback, useEffect, useMemo, useState } from "react"
  import { Link as RouterLink, createFileRoute } from "@tanstack/react-router"
  import { FiArrowUpRight, FiCheck, FiCopy } from "react-icons/fi"

  import { Badge } from "@/components/ui/badge"
  import { Button } from "@/components/ui/button"
  import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  import { hostingServers } from "@/data/hosting"
  import useCustomToast from "@/hooks/useCustomToast"

  const numberFormatter = new Intl.NumberFormat("en-US")
  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  function HostingIndexPage() {
    const showToast = useCustomToast()
    const [copiedKey, setCopiedKey] = useState<string | null>(null)

    const fleetSummary = useMemo(() => {
      return hostingServers.reduce(
        (acc, server) => {
          acc.totalServers += 1
          acc.connected += server.status === "Connected" ? 1 : 0
          acc.trial += server.isTrial ? 1 : 0
          acc.totalMonthlyCharged += server.isTrial
            ? 0
            : server.monthlyComputePrice
          acc.totalMonthlyList += server.fullMonthlyComputePrice
          acc.totalVcpus += server.vCPUs ?? 0
          acc.totalRam += server.ramGB
          acc.totalStorage += server.storageSizeGB
          acc.rotating += server.hasRotatingIP ? 1 : 0
          acc.backup += server.hasBackup ? 1 : 0
          acc.monitoring += server.hasMonitoring ? 1 : 0
          acc.managed += server.hasManagedSupport ? 1 : 0
          return acc
        },
        {
          totalServers: 0,
          connected: 0,
          trial: 0,
          totalMonthlyCharged: 0,
          totalMonthlyList: 0,
          totalVcpus: 0,
          totalRam: 0,
          totalStorage: 0,
          rotating: 0,
          backup: 0,
          monitoring: 0,
          managed: 0,
        },
      )
    }, [])

    const offlineCount = fleetSummary.totalServers - fleetSummary.connected

    const handleCopy = useCallback(
      async (value: string, label: string, key: string) => {
        try {
          if (typeof navigator === "undefined" || !navigator.clipboard) {
            throw new Error("Clipboard API unavailable")
          }
          await navigator.clipboard.writeText(value)
          setCopiedKey(key)
          showToast(`${label} copied`, value, "success")
        } catch (error) {
          console.error("Unable to copy value", error)
          showToast(
            "Copy failed",
            "We could not copy that value to your clipboard.",
            "error",
          )
        }
      },
      [showToast],
    )

    useEffect(() => {
      if (!copiedKey) return
      const timeout = window.setTimeout(() => setCopiedKey(null), 2000)
      return () => window.clearTimeout(timeout)
    }, [copiedKey])

    return (
      <div className="space-y-12">
        <div className="rounded-[32px] border border-slate-200/70 bg-white/85 px-6 py-8 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/75 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)]">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-3">
              <Badge className="rounded-full border border-indigo-200/70 bg-indigo-500/10 px-4 py-1 text-[0.65rem] uppercase tracking-[0.22em] text-indigo-700 dark:border-indigo-500/30 dark:text-indigo-100">
                Managed VPS
              </Badge>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                VPS fleet overview
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Credentials, service health, and feature coverage now mirror the refreshed dashboard styling.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="gap-2 rounded-full border-slate-200/80 bg-white/60 px-5 py-2 text-sm font-semibold shadow-sm transition hover:border-slate-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-slate-600"
            >
              <RouterLink to="billing">
                <span>Open billing cycle</span>
                <FiArrowUpRight className="h-4 w-4" />
              </RouterLink>
            </Button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryTile
              label="Total servers"
              value={numberFormatter.format(fleetSummary.totalServers)}
              description={`Trial seats: ${numberFormatter.format(fleetSummary.trial)}`}
            />
            <SummaryTile
              label="Connected"
              value={numberFormatter.format(fleetSummary.connected)}
              description={
                offlineCount > 0
                  ? `${offlineCount} need attention`
                  : "All nodes healthy"
              }
            />
            <SummaryTile
              label="Monthly run rate"
              value={currencyFormatter.format(fleetSummary.totalMonthlyCharged)}
              description={`List price ${currencyFormatter.format(fleetSummary.totalMonthlyList)}`}
            />
            <SummaryTile
              label="Provisioned capacity"
              value={`${numberFormatter.format(fleetSummary.totalVcpus)} vCPU`}
              description={`${numberFormatter.format(fleetSummary.totalRam)} GB RAM · ${numberFormatter.format(fleetSummary.totalStorage)} GB storage`}
            />
          </div>
        </div>

        <Card className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
          <CardHeader className="space-y-2 border-b border-slate-200/70 pb-6 dark:border-slate-700/60">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Access credentials
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Copy-ready login details for each managed node, aligned with the dashboard glassmorphism treatment.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
                  <TableRow className="border-slate-200/70 dark:border-slate-700/60">
                    <TableHead>Device</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead>OS</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hostingServers.map((server) => (
                    <TableRow
                      key={server.name}
                      className="border-slate-200/70 transition-colors hover:bg-slate-100/60 dark:border-slate-700/60 dark:hover:bg-slate-800/50"
                    >
                      <TableCell className="align-top font-medium text-slate-900 dark:text-slate-50">
                        <div>{server.name}</div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Active since {formatDate(server.activeSince)}
                        </p>
                      </TableCell>
                      <TableCell className="align-top text-sm text-slate-700 dark:text-slate-300">
                        <div className="font-medium text-slate-900 dark:text-slate-50">
                          {server.ip}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {server.os.toUpperCase()} · Kernel {server.kernel}
                        </p>
                      </TableCell>
                      <TableCell>
                        <CredentialCell
                          label="Username"
                          value={server.username}
                          isCopied={copiedKey === `${server.name}-username`}
                          onCopy={() =>
                            handleCopy(server.username, "Username", `${server.name}-username`)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <CredentialCell
                          label="Password"
                          value={server.password}
                          isCopied={copiedKey === `${server.name}-password`}
                          onCopy={() =>
                            handleCopy(server.password, "Password", `${server.name}-password`)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={server.status === "Connected" ? "success" : "warning"}
                            className="rounded-full px-3 py-1 text-xs font-semibold"
                          >
                            {server.status}
                          </Badge>
                          {server.isTrial ? (
                            <Badge variant="outline" className="rounded-full border-amber-400/60 px-2.5 py-0.5 text-[0.65rem] uppercase tracking-[0.18em] text-amber-500">
                              Trial
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full border-slate-300/80 px-3 py-1 text-xs font-semibold hover:border-slate-400"
                            asChild
                          >
                            <RouterLink to={`/hosting/${encodeURIComponent(server.name)}`}>
                              View details
                            </RouterLink>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={6} className="text-right text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {fleetSummary.totalServers} servers · {numberFormatter.format(fleetSummary.connected)} connected · {numberFormatter.format(fleetSummary.trial)} trial
                      {fleetSummary.trial === 1 ? " seat" : " seats"}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center gap-4 border-t border-slate-200/70 bg-white/70 py-6 text-sm text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-slate-400">
            <p>
              Charged run rate {currencyFormatter.format(fleetSummary.totalMonthlyCharged)} · List price {currencyFormatter.format(fleetSummary.totalMonthlyList)}.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Rotation, backup, monitoring, and managed support counts update alongside your dashboard tiles.
            </p>
          </CardFooter>
        </Card>

        <Card className="rounded-[28px] border border-slate-200/70 bg-white/95 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-35px_rgba(15,23,42,0.65)]">
          <CardHeader className="space-y-2 border-b border-slate-200/70 pb-6 dark:border-slate-700/60">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Feature coverage
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              A quick glance at optional capabilities enabled across the fleet.
            </p>
          </CardHeader>
          <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
            <FeatureHighlight
              label="Rotating IPs"
              value={fleetSummary.rotating}
              description="Elastic IP pools for geo-targeting and session replays."
            />
            <FeatureHighlight
              label="Backups"
              value={fleetSummary.backup}
              description="Automated snapshots with 7-day retention for recovery."
            />
            <FeatureHighlight
              label="Monitoring"
              value={fleetSummary.monitoring}
              description="Continuous health telemetry with proactive alerts."
            />
            <FeatureHighlight
              label="Managed support"
              value={fleetSummary.managed}
              description="Hands-on OS patching and incident response coverage."
            />
          </CardContent>
        </Card>
      </div>
    )
          overflow="hidden"

  const SummaryTile = ({
    label,
    value,
    description,
  }: {
    label: string
    value: string
    description: string
  }) => (
    <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-5 shadow-[0_18px_40px_-35px_rgba(15,23,42,0.45)] dark:border-slate-700/60 dark:bg-slate-900/60">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  )

  const CredentialCell = ({
    label,
    value,
    onCopy,
    isCopied,
  }: {
    label: string
    value: string
    onCopy: () => void
    isCopied: boolean
  }) => (
    <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
      <span className="font-medium text-slate-900 dark:text-slate-100">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full border border-transparent text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200"
        onClick={onCopy}
        aria-label={`Copy ${label}`}
      >
        {isCopied ? <FiCheck className="h-4 w-4 text-emerald-500" /> : <FiCopy className="h-4 w-4" />}
      </Button>
    </div>
  )

  const FeatureHighlight = ({
    label,
    value,
    description,
  }: {
    label: string
    value: number
    description: string
  }) => (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-[0_18px_40px_-35px_rgba(15,23,42,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_26px_60px_-40px_rgba(15,23,42,0.45)] dark:border-slate-700/60 dark:bg-slate-900/55 dark:hover:shadow-[0_26px_60px_-38px_rgba(15,23,42,0.6)]">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {label}
        </p>
        <Badge className="rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-600/60 dark:bg-slate-900/70 dark:text-slate-200">
          {numberFormatter.format(value)}
        </Badge>
      </div>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  )

  const formatDate = (isoDate: string) => {
    try {
      const date = new Date(isoDate)
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date)
    } catch (error) {
      return isoDate
    }
  }

  export const Route = createFileRoute("/_layout/hosting/")({
    component: HostingIndexPage,
  })
            <Heading size="md" color="red.800">
              Server Credentials
            </Heading>
          </CardHeader>
          <CardBody>
            <Table variant="simple" size="md">
              <Thead bg="red.100">
                <Tr>
                  <Th color="red.800">Device Name</Th>
                  <Th color="red.800">IP</Th>
                  <Th color="red.800">Username</Th>
                  <Th color="red.800">Password</Th>
                  <Th color="red.800">OS</Th>
                  <Th color="red.800" isNumeric>
                    Actions
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {servers.map((server) => (
                  <Tr key={server.name}>
                    <Td>{server.name}</Td>
                    <Td>{server.ip}</Td>
                    <Td>{server.username}</Td>
                    <Td>{server.password}</Td>
                    <Td>
                      {server.os
                        ? server.os.charAt(0).toUpperCase() + server.os.slice(1)
                        : "Unknown"}
                    </Td>
                    <Td isNumeric>
                      <HStack spacing={2} justify="flex-end">
                        <CopyCell
                          textToCopy={server.username}
                          label="Username"
                        />
                        <CopyCell
                          textToCopy={server.password}
                          label="Password"
                        />
                        <Button
                          size="sm"
                          as={Link}
                          to={`/hosting/${encodeURIComponent(server.name)}`}
                          colorScheme="red"
                          variant="outline"
                        >
                          View Details
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
              <Tfoot bg="red.50">
                <Tr>
                  <Th colSpan={6} color="red.800">
                    Total Servers: {servers.length}
                  </Th>
                </Tr>
              </Tfoot>
            </Table>
          </CardBody>
        </Card>

        {/* Roaming Proxy Features Card */}
        <Card borderWidth="1px" borderRadius="lg" boxShadow="sm" bg="gray.50">
          <CardHeader bg="red.100">
            <Heading size="md" color="red.800">
              Server Features
            </Heading>
          </CardHeader>
          <CardBody>
            <List spacing={4}>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                <Text as="span" fontWeight="semibold">
                  Rotating IPs:
                </Text>{" "}
                {servers.filter((s) => s.hasRotatingIP === true).length} servers
                with rotating IPs for enhanced privacy and geo-targeting.
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                <Text as="span" fontWeight="semibold">
                  Backups:
                </Text>{" "}
                {servers.filter((s) => s.hasBackup === true).length} servers
                with automated backups for data protection.
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                <Text as="span" fontWeight="semibold">
                  Monitoring:
                </Text>{" "}
                {servers.filter((s) => s.hasMonitoring === true).length} servers
                with 24/7 monitoring for optimal performance.
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                <Text as="span" fontWeight="semibold">
                  Debian Optimized:
                </Text>{" "}
                All servers run on Debian for stability, performance, and
                unlimited bandwidth.
              </ListItem>
            </List>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  )
}

export const Route = createFileRoute("/_layout/hosting/")({
  component: HostingIndexPage,
})
