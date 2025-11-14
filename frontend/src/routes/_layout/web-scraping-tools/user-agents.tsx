import { useEffect, useMemo, useState } from "react"
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
	Copy,
	DownloadCloud,
	Edit,
	MoreHorizontal,
	Plus,
	RefreshCcw,
	Trash2,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import useCustomToast from "@/hooks/useCustomToast"
import type { UserPublic } from "@/client/types.gen"
import { parseApiResponse } from "@/lib/api"

const API_BASE_URL = "https://api.ROAMINGPROXY.com/v2"
const PAGE_SIZE = 50

type DeviceCategory = "all" | "desktop" | "mobile" | "other"

interface UserAgentPublic {
	id: string
	user_agent: string
	created_at: string
	device?: string | null
	browser?: string | null
	os?: string | null
}

interface UserAgentsResponse {
	data: UserAgentPublic[]
	count: number
}

interface UpdateSourceResponse {
	status: string
	new_agents_added: number
}

const TAB_CONFIG: Array<{
	id: DeviceCategory
	label: string
	badgeVariant?: "default" | "secondary"
}> = [
	{ id: "all", label: "All" },
	{ id: "desktop", label: "Desktop" },
	{ id: "mobile", label: "Mobile" },
	{ id: "other", label: "Other" },
]

const getAuthToken = () => {
	const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
	return token ?? ""
}

const request = async <T,>(endpoint: string, init?: RequestInit): Promise<T> => {
	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		...(init ?? {}),
		headers: {
			"Content-Type": "application/json",
			...(init?.headers ?? {}),
		},
	})

	return parseApiResponse<T>(response)
}

const fetchUserAgents = (page: number) =>
	request<UserAgentsResponse>(`/user-agents/?skip=${page * PAGE_SIZE}&limit=${PAGE_SIZE}`)

const fetchAllUserAgents = () => request<UserAgentsResponse>(`/user-agents/?limit=10000`)

const updateFromSource = () =>
	request<UpdateSourceResponse>("/user-agents/update-from-source/", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${getAuthToken()}`,
		},
	})

const createUserAgent = (payload: { user_agent: string }) =>
	request<UserAgentPublic>("/user-agents/", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${getAuthToken()}`,
		},
		body: JSON.stringify(payload),
	})

const updateUserAgent = (id: string, payload: { user_agent: string }) =>
	request<UserAgentPublic>(`/user-agents/${id}`, {
		method: "PUT",
		headers: {
			Authorization: `Bearer ${getAuthToken()}`,
		},
		body: JSON.stringify(payload),
	})

const deleteUserAgent = (id: string) =>
	request<void>(`/user-agents/${id}`, {
		method: "DELETE",
		headers: {
			Authorization: `Bearer ${getAuthToken()}`,
		},
	})

const downloadFile = (content: string, filename: string, mimeType: string) => {
	const blob = new Blob([content], { type: mimeType })
	const url = URL.createObjectURL(blob)
	const anchor = document.createElement("a")
	anchor.href = url
	anchor.download = filename
	document.body.appendChild(anchor)
	anchor.click()
	document.body.removeChild(anchor)
	URL.revokeObjectURL(url)
}

const formatDeviceLabel = (device?: string | null) => {
	if (!device) return "Unknown"
	return device.charAt(0).toUpperCase() + device.slice(1)
}

const AddEditDialog = ({
	mode,
	open,
	onOpenChange,
	onSubmit,
	isSubmitting,
	initialValue,
}: {
	mode: "create" | "edit"
	open: boolean
	onOpenChange: (open: boolean) => void
	onSubmit: (value: string) => void
	isSubmitting: boolean
	initialValue?: string
}) => {
	const [value, setValue] = useState(initialValue ?? "")

	useEffect(() => {
		if (open) {
			setValue(initialValue ?? "")
		}
	}, [open, initialValue])

	const title = mode === "create" ? "Add user agent" : "Edit user agent"

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) {
					setValue(initialValue ?? "")
				}
				onOpenChange(next)
			}}
		>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>
						Provide a full user agent string. We automatically capture device, OS, and browser metadata.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					<Label htmlFor="user-agent">User agent</Label>
					<Textarea
						id="user-agent"
						className="min-h-[140px]"
						value={value}
						onChange={(event) => setValue(event.target.value)}
						placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
					/>
				</div>
				<DialogFooter className="gap-3">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						onClick={() => onSubmit(value)}
						disabled={!value.trim()}
						isLoading={isSubmitting}
						loadingText="Saving..."
					>
						Save changes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

const DeleteDialog = ({
	open,
	onOpenChange,
	onConfirm,
	isSubmitting,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	onConfirm: () => void
	isSubmitting: boolean
}) => (
	<Dialog open={open} onOpenChange={onOpenChange}>
		<DialogContent className="max-w-sm">
			<DialogHeader>
				<DialogTitle>Delete user agent</DialogTitle>
				<DialogDescription>
					This action cannot be undone. The string will be permanently removed from your workspace catalogue.
				</DialogDescription>
			</DialogHeader>
			<DialogFooter className="gap-3">
				<Button variant="outline" onClick={() => onOpenChange(false)}>
					Cancel
				</Button>
				<Button
					variant="destructive"
					onClick={onConfirm}
					isLoading={isSubmitting}
					loadingText="Deleting..."
				>
					Delete
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
)

const UserAgentsPage = () => {
	const toast = useCustomToast()
	const queryClient = useQueryClient()
	const [page, setPage] = useState(0)
	const [activeTab, setActiveTab] = useState<DeviceCategory>("all")
	const [dialogState, setDialogState] = useState<{
		mode: "create" | "edit"
		target?: UserAgentPublic
		open: boolean
	}>({ mode: "create", open: false })
	const [deleteTarget, setDeleteTarget] = useState<UserAgentPublic | null>(null)

	const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])

	const { data, isLoading, error, isPlaceholderData } = useQuery({
		queryKey: ["userAgents", page],
		queryFn: () => fetchUserAgents(page),
		placeholderData: keepPreviousData,
		staleTime: 60_000,
	})

	const createMutation = useMutation({
		mutationFn: createUserAgent,
		onSuccess: () => {
			toast("User agent added", "The new agent has been saved to your library.", "success")
			queryClient.invalidateQueries({ queryKey: ["userAgents"] })
			setDialogState((state) => ({ ...state, open: false }))
		},
		onError: (err: Error) => {
			toast("Unable to add", err.message, "error")
		},
	})

	const updateMutation = useMutation({
		mutationFn: ({ id, value }: { id: string; value: string }) => updateUserAgent(id, { user_agent: value }),
		onSuccess: () => {
			toast("User agent updated", "Changes were applied successfully.", "success")
			queryClient.invalidateQueries({ queryKey: ["userAgents"] })
			setDialogState((state) => ({ ...state, open: false }))
		},
		onError: (err: Error) => {
			toast("Update failed", err.message, "error")
		},
	})

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteUserAgent(id),
		onSuccess: () => {
			toast("User agent removed", "The entry was deleted from your workspace.", "success")
			queryClient.invalidateQueries({ queryKey: ["userAgents"] })
			setDeleteTarget(null)
		},
		onError: (err: Error) => {
			toast("Delete failed", err.message, "error")
		},
	})

	const refreshMutation = useMutation({
		mutationFn: updateFromSource,
		onSuccess: (result) => {
			toast("Source refreshed", `${result.new_agents_added} new agents were added.`, "success")
			queryClient.invalidateQueries({ queryKey: ["userAgents"] })
		},
		onError: (err: Error) => {
			toast("Refresh failed", err.message, "error")
		},
	})

	const exportMutation = useMutation({
		mutationFn: async (format: "csv" | "json") => {
			const response = await fetchAllUserAgents()
			if (format === "csv") {
				const headers = "id,user_agent,created_at,device,browser,os"
				const rows = response.data.map((agent) => {
					const values = [
						agent.id,
						agent.user_agent.replace(/"/g, '""'),
						agent.created_at,
						agent.device ?? "",
						agent.browser ?? "",
						agent.os ?? "",
					]
					return values.map((value) => `"${value}"`).join(",")
				})
				downloadFile([headers, ...rows].join("\n"), "user-agents.csv", "text/csv")
			} else {
				downloadFile(JSON.stringify(response.data, null, 2), "user-agents.json", "application/json")
			}
		},
		onSuccess: () => {
			toast("Export started", "Your download should begin momentarily.", "success")
		},
		onError: (err: Error) => {
			toast("Export failed", err.message, "error")
		},
	})

	const agents = data?.data ?? []
	const totalCount = data?.count ?? 0
	const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

	const filteredAgents = useMemo(() => {
		switch (activeTab) {
			case "desktop":
				return agents.filter((agent) => agent.device?.toLowerCase() === "desktop")
			case "mobile":
				return agents.filter((agent) => agent.device?.toLowerCase() === "mobile")
			case "other":
				return agents.filter((agent) => {
					const device = agent.device?.toLowerCase()
					return device !== "desktop" && device !== "mobile"
				})
			default:
				return agents
		}
	}, [agents, activeTab])

	const canManage = currentUser?.is_superuser ?? false

	const openCreateDialog = () => setDialogState({ mode: "create", open: true })
	const openEditDialog = (agent: UserAgentPublic) => setDialogState({ mode: "edit", target: agent, open: true })

	const handleSubmitDialog = (value: string) => {
		if (dialogState.mode === "edit" && dialogState.target) {
			updateMutation.mutate({ id: dialogState.target.id, value })
			return
		}

		createMutation.mutate({ user_agent: value })
	}

	const handleCopy = (value: string) => {
		if (typeof navigator === "undefined" || !navigator.clipboard) {
			toast("Copy unavailable", "Clipboard access is not available in this environment.", "error")
			return
		}

		navigator.clipboard.writeText(value).then(() => {
			toast("Copied", "The user agent has been copied to your clipboard.", "success")
		})
	}

	return (
		<div className="space-y-10 py-10">
			<Card className="relative overflow-hidden border border-transparent text-slate-900 shadow-[0_34px_88px_-48px_rgba(16,185,129,0.62)] dark:text-slate-100">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.65),_transparent_52%),_radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.5),_transparent_58%)]" />
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/78 via-white/52 to-white/30 dark:from-slate-900/80 dark:via-slate-900/70 dark:to-slate-900/38" />
				<CardHeader className="relative space-y-4 rounded-[22px] bg-white/78 p-6 shadow-[0_20px_44px_-28px_rgba(15,23,42,0.42)] backdrop-blur dark:bg-slate-900/70">
					<div className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 px-4 py-1 text-[0.65rem] uppercase tracking-[0.25em] text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/70">
						<span>Web scraping</span>
						<span className="h-1 w-1 rounded-full bg-slate-400" aria-hidden="true" />
						<span>User agents</span>
					</div>
					<div className="space-y-2">
						<CardTitle className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
							User agent catalogue
						</CardTitle>
						<CardDescription>
							Curate and rotate trusted user agents for your scraping workloads. Track source refreshes and manage overrides in one place.
						</CardDescription>
					</div>
				</CardHeader>
			</Card>

			<Card className="border border-slate-200/70 bg-white/85 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.5)] backdrop-blur-lg dark:border-slate-700/60 dark:bg-slate-900/70">
				<CardHeader className="gap-6">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
						<div className="flex flex-wrap items-center gap-2">
							{TAB_CONFIG.map((tab) => (
								<Button
									key={tab.id}
									variant={activeTab === tab.id ? "default" : "secondary"}
									className="rounded-full"
									onClick={() => setActiveTab(tab.id)}
								>
									<span>{tab.label}</span>
									<Badge variant="outline" className="ml-2 rounded-full px-2 py-0 text-[0.65rem]">
										{tab.id === "all" ? agents.length : filteredAgents.length}
									</Badge>
								</Button>
							))}
						</div>
						<div className="flex flex-wrap gap-3">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										className="rounded-full"
										disabled={exportMutation.isPending}
									>
										<DownloadCloud className="mr-2 h-4 w-4" />
										{exportMutation.isPending ? "Exporting" : "Export"}
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-40">
									<DropdownMenuItem onClick={() => exportMutation.mutate("csv")}>
										CSV
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => exportMutation.mutate("json")}>
										JSON
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
							{canManage ? (
								<>
									<Button
										variant="secondary"
										className="rounded-full"
										onClick={() => refreshMutation.mutate()}
										isLoading={refreshMutation.isPending}
										loadingText="Refreshing..."
									>
										<RefreshCcw className="mr-2 h-4 w-4" />
										Refresh source
									</Button>
									<Button className="rounded-full" onClick={openCreateDialog}>
										<Plus className="mr-2 h-4 w-4" />
										Add user agent
									</Button>
								</>
							) : null}
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-300">
						{totalCount > 0 ? (
							<span>{totalCount.toLocaleString()} total user agents indexed across your workspace.</span>
						) : (
							<span>The catalogue is empty. Refresh the source or add your first override.</span>
						)}
					</div>

					{isLoading && !data ? (
						<div className="flex h-[320px] items-center justify-center">
							<Spinner size={48} />
						</div>
					) : error ? (
						<Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
							<AlertTitle>Unable to load user agents</AlertTitle>
							<AlertDescription>{error instanceof Error ? error.message : "Unexpected error"}</AlertDescription>
						</Alert>
					) : (
						<div className="overflow-hidden rounded-2xl border border-slate-200/70 shadow-sm dark:border-slate-700/60">
							<Table>
								<TableHeader className="bg-slate-100/60 dark:bg-slate-800/40">
									<TableRow className="border-slate-200/70 dark:border-slate-700/60">
										<TableHead>User agent</TableHead>
										<TableHead className="w-[120px]">Device</TableHead>
										<TableHead className="w-[140px]">OS</TableHead>
										<TableHead className="w-[140px]">Browser</TableHead>
										<TableHead className="w-[100px] text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredAgents.length === 0 ? (
										<TableRow>
											<TableCell colSpan={5} className="py-16 text-center text-sm text-muted-foreground">
												No user agents match this filter.
											</TableCell>
										</TableRow>
									) : (
										filteredAgents.map((agent) => (
											<TableRow key={agent.id} className="border-slate-200/70 dark:border-slate-700/60">
												<TableCell className="max-w-[520px] whitespace-pre-wrap font-mono text-sm">
													{agent.user_agent}
												</TableCell>
												<TableCell>
													<Badge variant="outline" className="rounded-full px-3 py-0.5 text-xs">
														{formatDeviceLabel(agent.device)}
													</Badge>
												</TableCell>
												<TableCell className="text-sm text-slate-600 dark:text-slate-300">
													{agent.os ?? "—"}
												</TableCell>
												<TableCell className="text-sm text-slate-600 dark:text-slate-300">
													{agent.browser ?? "—"}
												</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-2">
														<Button
															size="icon"
															variant="ghost"
															className="rounded-full"
															onClick={() => handleCopy(agent.user_agent)}
															aria-label="Copy user agent"
														>
															<Copy className="h-4 w-4" />
														</Button>
														{canManage ? (
															<DropdownMenu>
																<DropdownMenuTrigger asChild>
																	<Button size="icon" variant="ghost" className="rounded-full">
																		<MoreHorizontal className="h-4 w-4" />
																	</Button>
																</DropdownMenuTrigger>
																<DropdownMenuContent align="end">
																	<DropdownMenuItem onClick={() => openEditDialog(agent)}>
																		<Edit className="mr-2 h-4 w-4" />
																		Edit
																	</DropdownMenuItem>
																	<DropdownMenuItem onClick={() => setDeleteTarget(agent)}>
																		<Trash2 className="mr-2 h-4 w-4" />
																		Delete
																	</DropdownMenuItem>
																</DropdownMenuContent>
															</DropdownMenu>
														) : null}
													</div>
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
								<TableFooter>
									<TableRow>
										<TableCell colSpan={5} className="text-right text-sm text-muted-foreground">
											Page {page + 1} of {totalPages}
										</TableCell>
									</TableRow>
								</TableFooter>
							</Table>
						</div>
					)}

					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="text-sm text-muted-foreground">
							Showing {filteredAgents.length} result{filteredAgents.length === 1 ? "" : "s"} on this page.
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								className="rounded-full"
								onClick={() => setPage((current) => Math.max(0, current - 1))}
								disabled={page === 0 || isLoading}
							>
								Previous
							</Button>
							<Button
								variant="outline"
								className="rounded-full"
								onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
								disabled={page + 1 >= totalPages || isPlaceholderData}
							>
								Next
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<AddEditDialog
				mode={dialogState.mode}
				open={dialogState.open}
				onOpenChange={(open) => setDialogState((state) => ({ ...state, open }))}
				onSubmit={handleSubmitDialog}
				isSubmitting={createMutation.isPending || updateMutation.isPending}
				initialValue={dialogState.target?.user_agent}
			/>

			<DeleteDialog
				open={Boolean(deleteTarget)}
				onOpenChange={(open) => {
					if (!open) {
						setDeleteTarget(null)
					}
				}}
				onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
				isSubmitting={deleteMutation.isPending}
			/>
		</div>
	)
}

export const Route = createFileRoute("/_layout/web-scraping-tools/user-agents")({
	component: UserAgentsPage,
})

export default UserAgentsPage