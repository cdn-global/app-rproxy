import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import type React from "react"
import { useCallback, useEffect } from "react"
import useAuth from "../../hooks/useAuth"
import PromoSERP from "./ComingSoon" // Adjust the import path as needed

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface SubscriptionStatus {
  hasSubscription: boolean
  isTrial: boolean
  isDeactivated: boolean
}

async function fetchSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    const token = localStorage.getItem("access_token")
    const response = await fetch(
      "https://api.ROAMINGPROXY.com/v2/subscription-status",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      },
    )

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("Unauthorized: Invalid or expired session.")
      }
      throw new Error(`Failed to fetch subscription status: ${response.status}`)
    }

    const data = await response.json()
    // Validate response shape
    if (
      typeof data.hasSubscription !== "boolean" ||
      typeof data.isTrial !== "boolean" ||
      typeof data.isDeactivated !== "boolean"
    ) {
      throw new Error("Invalid subscription status response")
    }

    return data
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Network error occurred while fetching subscription status")
  }
}

const ProtectedComponent: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = useCallback(async () => {
    await logout()
    navigate({ to: "/login" }) // Redirect to login after logout
  }, [logout, navigate])

  const {
    data: subscriptionStatus,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["subscriptionStatus", "serp"],
    queryFn: fetchSubscriptionStatus,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: (failureCount, error) => {
      if (
        error instanceof Error &&
        (error.message.includes("Unauthorized") ||
          error.message.includes("Invalid subscription status"))
      ) {
        return false // Don't retry on unauthorized or invalid response
      }
      return failureCount < 2 // Retry up to 2 times for other errors
    },
  })

  // Effect to automatically log out on error after a delay
  useEffect(() => {
    const isUnauthorizedError =
      error instanceof Error && error.message.includes("Unauthorized")

    // Only set a timer for non-authentication errors
    if (error && !isUnauthorizedError) {
      const timer = setTimeout(() => {
        handleLogout()
      }, 30000) // 30 seconds

      // Cleanup the timer if the component unmounts or error changes
      return () => clearTimeout(timer)
    }
  }, [error, handleLogout])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <Spinner size={32} />
        <p className="text-sm text-muted-foreground">Loading subscription status…</p>
      </div>
    )
  }

  // Error state
  if (error) {
    const isUnauthorizedError =
      error instanceof Error && error.message.includes("Unauthorized")

    // Handle session expiration immediately
    if (isUnauthorizedError) {
      return (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <Alert variant="destructive" className="max-w-md border-destructive/40 bg-destructive/10">
            <AlertTitle>Session expired</AlertTitle>
            <AlertDescription>
              Your session has expired. Please sign in again to continue.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate({ to: "/login" })}>Log in</Button>
        </div>
      )
    }

    // Handle other errors with a timed logout
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <Alert variant="destructive" className="max-w-lg border-destructive/40 bg-destructive/10">
          <AlertTitle>We hit a snag</AlertTitle>
          <AlertDescription>
            An error occurred while loading your subscription status. You&apos;ll be signed out shortly so you can start a fresh session.
          </AlertDescription>
        </Alert>
        <Button variant="destructive" onClick={handleLogout}>
          Logout now
        </Button>
      </div>
    )
  }

  // Validate subscription status
  if (!subscriptionStatus) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <Alert variant="destructive" className="max-w-md border-destructive/40 bg-destructive/10">
          <AlertTitle>Unable to load account data</AlertTitle>
          <AlertDescription>
            Please refresh the page or try again in a moment. If the problem persists, contact support.
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  // Extract subscription details
  const { hasSubscription, isTrial, isDeactivated } = subscriptionStatus

  // Define access conditions
  const isLocked = !hasSubscription && !isTrial // No subscription or trial
  const isFullyDeactivated = isDeactivated && !hasSubscription // Deactivated without subscription

  // No access: show promotional content for non-subscribed users
  if (isLocked) {
    return <PromoSERP />
  }

  // Deactivated tools: prompt to reactivate (only for non-subscribed users)
  if (isFullyDeactivated) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-6 py-4 text-sm text-destructive">
        <p>Your tools have been deactivated.</p>
        <Button
          variant="destructive"
          onClick={() => navigate({ to: "/proxies/pricing" })}
          className="rounded-full"
        >
          Reactivate now
        </Button>
      </div>
    )
  }

  // Subscribed or trial users: render protected content
  if (hasSubscription || isTrial) {
    return <>{children}</>
  }

  // Fallback: render protected content (should not be reached due to above conditions)
  return <>{children}</>
}

export default ProtectedComponent
