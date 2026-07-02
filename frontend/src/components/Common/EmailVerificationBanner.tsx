import { useMutation } from "@tanstack/react-query"
import { MailWarning, X } from "lucide-react"
import { useState } from "react"

import { OpenAPI } from "@/client"
import { Button } from "@/components/ui/button"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"

async function resendVerification(): Promise<{ message: string }> {
  const token = localStorage.getItem("access_token") || ""
  const response = await fetch(`${OpenAPI.BASE}/v2/verify-email/resend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || "Failed to resend verification email.")
  }
  return response.json()
}

const EmailVerificationBanner = () => {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const showToast = useCustomToast()

  const mutation = useMutation<{ message: string }, Error, void>({
    mutationFn: resendVerification,
    onSuccess: (data) => {
      showToast(
        "Verification email sent",
        data.message || "Check your inbox for the verification link.",
        "success",
      )
    },
    onError: (error) => {
      showToast("Couldn't send email", error.message, "error")
    },
  })

  if (!user || user.email_verified_at || dismissed) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
      <MailWarning className="h-4 w-4 shrink-0" />
      <span className="min-w-[200px] flex-1">
        Please verify your email address to secure your account. We sent a link
        to <span className="font-semibold">{user.email}</span>.
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="border-amber-400/60 bg-white/70 text-amber-900 hover:bg-white dark:bg-transparent dark:text-amber-100 dark:hover:bg-amber-500/20"
      >
        {mutation.isPending ? "Sending…" : "Resend email"}
      </Button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        className="rounded-md p-1 text-amber-700/80 hover:bg-amber-100 hover:text-amber-900 dark:text-amber-300/80 dark:hover:bg-amber-500/20"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default EmailVerificationBanner
