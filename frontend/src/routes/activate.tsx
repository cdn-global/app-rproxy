import { useMutation } from "@tanstack/react-query"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ApiError } from "../client"
import Logo from "../components/Common/Logo"
import { isLoggedIn } from "../hooks/useAuth"
import useCustomToast from "../hooks/useCustomToast"
import { confirmPasswordRules, handleError, passwordRules } from "../utils"

interface NewPasswordForm {
  new_password: string
  confirm_password: string
}

export const Route = createFileRoute("/activate")({
  component: ActivateAccount,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

async function activateAccount(data: { new_password: string; token: string }) {
  const baseUrl = "https://api.roamingproxy.com"
  const apiUrl = `${baseUrl}/v2/activate`
  console.log("Sending request to:", apiUrl, "with data:", data)
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      token: data.token,
      new_password: data.new_password,
    }),
  })

  console.log("Response status:", response.status, response.statusText)
  if (!response.ok) {
    const errorData = await response.json()
    console.error("Error response:", errorData)
    const error: ApiError = {
      name: "ApiError",
      url: apiUrl,
      status: response.status,
      statusText: response.statusText,
      body: errorData,
      request: {
        method: "POST",
        url: apiUrl,
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
        },
      },
      message: errorData.detail || "Failed to activate account",
    }
    throw error
  }

  return response.json()
}

function ActivateAccount() {
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  })
  const showToast = useCustomToast()
  const navigate = useNavigate()

  const mutation = useMutation<
    { message: string },
    ApiError,
    { new_password: string; token: string }
  >({
    mutationFn: activateAccount,
    onSuccess: () => {
      showToast("Success!", "Account activated successfully.", "success")
      reset()
      navigate({ to: "/login" })
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
  })

  const onSubmit: SubmitHandler<NewPasswordForm> = async (data) => {
    const token = new URLSearchParams(window.location.search).get("token")
    if (!token) {
      showToast("Error", "Activation token is missing.", "error")
      return
    }
    mutation.mutate({ new_password: data.new_password, token })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl bg-background shadow-lg md:grid-cols-[1fr,1fr]">
        <div className="flex flex-col gap-4 bg-muted/30 p-8 md:p-12">
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
            Activate Your Account
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            Set your new password to unlock seamless data management and take
            control with confidence.
          </p>
          <p className="text-sm text-muted-foreground">
            Need assistance? Our expert support team and comprehensive
            documentation are here to help.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col items-center gap-6 p-8 md:p-12"
        >
          <Logo
            src="/assets/images/roaming-proxy-network-logo.png"
            alt="Roaming Proxy Logo"
            imgClassName="w-24 md:w-28"
            className="self-start"
          />

          <div className="w-full space-y-2">
            <Label htmlFor="new_password">Set Password</Label>
            <Input
              id="new_password"
              {...register("new_password", passwordRules())}
              placeholder="Password"
              type="password"
              className="h-12 text-base"
            />
            {errors.new_password ? (
              <p className="text-sm text-destructive">
                {errors.new_password.message}
              </p>
            ) : null}
          </div>

          <div className="w-full space-y-2">
            <Label htmlFor="confirm_password">Confirm Password</Label>
            <Input
              id="confirm_password"
              {...register("confirm_password", confirmPasswordRules(getValues))}
              placeholder="Confirm Password"
              type="password"
              className="h-12 text-base"
            />
            {errors.confirm_password ? (
              <p className="text-sm text-destructive">
                {errors.confirm_password.message}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingText="Activating"
            className="h-12 w-full text-base"
            variant="primary"
          >
            Activate Account
          </Button>
        </form>
      </div>
    </div>
  )
}

export default ActivateAccount
