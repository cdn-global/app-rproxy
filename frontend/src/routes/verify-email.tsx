import { useMutation } from "@tanstack/react-query"
import {
  Link as RouterLink,
  createFileRoute,
} from "@tanstack/react-router"
import { useEffect, useRef } from "react"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"

import { OpenAPI } from "@/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Logo from "../components/Common/Logo"
import { isLoggedIn } from "../hooks/useAuth"

export const Route = createFileRoute("/verify-email")({
  component: VerifyEmail,
})

async function verifyEmail(token: string): Promise<{ message: string }> {
  const response = await fetch(`${OpenAPI.BASE}/v2/verify-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ token }),
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || "We couldn't verify your email.")
  }
  return response.json()
}

function VerifyEmail() {
  const hasRun = useRef(false)
  const mutation = useMutation<{ message: string }, Error, string>({
    mutationFn: verifyEmail,
  })

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true
    const token = new URLSearchParams(window.location.search).get("token")
    if (!token) {
      mutation.mutate("")
      return
    }
    mutation.mutate(token)
  }, [mutation])

  const isSuccess = mutation.isSuccess
  const isError = mutation.isError
  const isPending = mutation.isPending || mutation.isIdle

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-8">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 rounded-2xl bg-background p-8 shadow-lg sm:p-10">
        <Logo />
        {isPending && (
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Verifying your email…
            </p>
          </div>
        )}
        {isSuccess && (
          <div className="flex w-full flex-col items-center gap-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight">
                Email verified
              </h1>
              <p className="text-sm text-muted-foreground">
                Your email address has been confirmed.
              </p>
            </div>
            <Button asChild className="w-full">
              <RouterLink to={isLoggedIn() ? "/" : "/login"}>
                Continue
              </RouterLink>
            </Button>
          </div>
        )}
        {isError && (
          <div className="flex w-full flex-col items-center gap-4 text-center">
            <XCircle className="h-10 w-10 text-destructive" />
            <Alert
              variant="destructive"
              className="border-destructive/30 bg-destructive/10 text-left"
            >
              <AlertTitle>Verification failed</AlertTitle>
              <AlertDescription>
                {mutation.error?.message ||
                  "This verification link is invalid or has expired."}
              </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground">
              Sign in and request a new verification email from the banner at
              the top of your dashboard.
            </p>
            <Button asChild variant="outline" className="w-full">
              <RouterLink to="/login">Back to login</RouterLink>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail
