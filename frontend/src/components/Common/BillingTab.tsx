import { useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import useCustomToast from "../../hooks/useCustomToast"

// --- Helper function for Billing ---
const fetchBillingPortal = async (token: string) => {
  const response = await fetch(
    "https://api.ROAMINGPROXY.com/v2/customer-portal",
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch portal: ${response.status}`)
  }
  const data = await response.json()
  if (!data.portal_url) {
    throw new Error("No portal URL received")
  }
  return data.portal_url
}

// --- Tab Content: BillingTab ---
const BillingTab = () => {
  const [token] = useState<string | null>(localStorage.getItem("access_token"))
  const [isLoading, setIsLoading] = useState(false)
  const toast = useCustomToast()

  const handleBillingClick = async () => {
    if (!token) return

    setIsLoading(true)
    try {
      const portalUrl = await fetchBillingPortal(token)
      window.location.href = portalUrl
    } catch (error) {
      console.error("Error accessing customer portal:", error)
      toast(
        "Unable to open portal",
        "Failed to access the billing portal. Please try again in a few moments.",
        "error",
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Guard clause to match the provided template's pattern
  if (!token) {
    return (
      <div className="w-full rounded-2xl border border-amber-200/60 bg-amber-100/60 p-6 text-sm text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">
        Please log in to manage your billing information.
      </div>
    )
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.65)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_24px_60px_-48px_rgba(15,23,42,0.75)]">
      <div className="space-y-3">
        <Alert className="border-slate-200/60 bg-white/80 text-left shadow-none dark:border-slate-700/60 dark:bg-slate-900/70">
          <AlertTitle className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Billing portal
          </AlertTitle>
          <AlertDescription>
            Manage subscriptions, review invoices, and update payment methods. We&apos;ll redirect you to the secure customer portal.
          </AlertDescription>
        </Alert>
      </div>
      <Button
        onClick={handleBillingClick}
        disabled={isLoading}
        className="w-full rounded-full md:w-auto"
      >
        {isLoading ? "Redirecting…" : "Manage billing"}
      </Button>
    </div>
  )
}

export default BillingTab
