import { useQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { FaUserSecret } from "react-icons/fa"
import { FiCreditCard, FiLogOut, FiUser } from "react-icons/fi"

import useAuth from "../../hooks/useAuth"
import useCustomToast from "../../hooks/useCustomToast"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Define SubscriptionStatus interface (copied from ProtectedComponent)
interface SubscriptionStatus {
  hasSubscription: boolean
  isTrial: boolean
  isDeactivated: boolean
}

// Fetch subscription status (copied from ProtectedComponent)
async function fetchSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    const token = localStorage.getItem("access_token")
    const response = await fetch(
      "/v2/subscription-status",
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

const UserMenu = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const toast = useCustomToast()

  // Fetch subscription status (optional, remove if not needed)
  const { data: subscriptionStatus, error } = useQuery({
    queryKey: ["subscriptionStatus", "user-menu"],
    queryFn: fetchSubscriptionStatus,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: (failureCount, error) => {
      if (
        error instanceof Error &&
        (error.message.includes("Unauthorized") ||
          error.message.includes("Invalid subscription status"))
      ) {
        return false
      }
      return failureCount < 2
    },
  })

  const handleLogout = async () => {
    try {
      await logout()
      navigate({ to: "/login" })
      toast("Logged out", "You have been successfully logged out.", "success")
    } catch (error) {
      toast(
        "Logout failed",
        "An error occurred while logging out. Please try again.",
        "error",
      )
    }
  }

  // Handle unauthorized error (e.g., session expired)
  if (error?.message.includes("Unauthorized")) {
    return (
      <div className="fixed right-4 top-4">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-10 w-10 rounded-full border border-destructive/40 bg-destructive/10 text-destructive hover:border-destructive/60 hover:bg-destructive/15"
          onClick={() => navigate({ to: "/login" })}
          aria-label="Log in"
          data-testid="login-button"
        >
          <FaUserSecret className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed right-4 top-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full border border-border bg-background/70 shadow-sm hover:border-primary hover:bg-background dark:border-border dark:bg-background/70"
            data-testid="user-menu-button"
            aria-label="User menu"
          >
            <FaUserSecret className="h-4 w-4 text-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 rounded-2xl border border-border bg-popover/80 p-2 shadow-lg backdrop-blur-xl">
          <DropdownMenuItem asChild className="gap-2 text-sm my-1">
            <Link to="/settings">
              <FiUser className="h-4 w-4 text-muted-foreground" />
              Settings
            </Link>
          </DropdownMenuItem>
          {subscriptionStatus &&
            (subscriptionStatus.hasSubscription ||
              subscriptionStatus.isTrial) && (
              <DropdownMenuItem asChild className="gap-2 text-sm my-1">
                <Link to="/proxies/pricing">
                  <FiCreditCard className="h-4 w-4 text-muted-foreground" />
                  Manage subscription
                </Link>
              </DropdownMenuItem>
            )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault()
              handleLogout()
            }}
            className="gap-2 text-sm font-medium text-destructive focus:text-destructive my-1"
            data-testid="logout-menu-item"
          >
            <FiLogOut className="h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default UserMenu
