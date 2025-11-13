import { useMutation } from "@tanstack/react-query"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type ApiError, LoginService, type NewPassword } from "../client"
import Logo from "../components/Common/Logo"
import { isLoggedIn } from "../hooks/useAuth"
import useCustomToast from "../hooks/useCustomToast"
import { confirmPasswordRules, handleError, passwordRules } from "../utils"

interface NewPasswordForm extends NewPassword {
  confirm_password: string
}

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

function ResetPassword() {
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

  const resetPassword = async (data: NewPassword) => {
    const token = new URLSearchParams(window.location.search).get("token")
    if (!token) {
      throw new Error("Reset token is missing")
    }
    await LoginService.resetPassword({
      requestBody: { new_password: data.new_password, token: token },
    })
  }

  const mutation = useMutation<void, ApiError, NewPassword>({
    mutationFn: resetPassword,
    onSuccess: () => {
      showToast("Success!", "Password updated successfully.", "success")
      reset()
      navigate({ to: "/login" })
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
  })

  const onSubmit: SubmitHandler<NewPasswordForm> = async (data) => {
    if (isSubmitting) return
    const token = new URLSearchParams(window.location.search).get("token")
    if (!token) {
      showToast("Error", "Reset token is missing.", "error")
      return
    }
    mutation.mutate(data)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl bg-background shadow-lg md:grid-cols-[1fr,1fr]">
        <div className="flex flex-col gap-4 bg-muted/30 p-8 md:p-12">
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
            Reset Your Password
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            Set a new password to regain access and continue managing your data
            with ease.
          </p>
          <p className="text-sm text-muted-foreground">
            Need help? Our support team and documentation are ready to assist
            you.
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
              type="password"
              placeholder="Password"
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
              type="password"
              placeholder="Confirm Password"
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
            loadingText="Resetting"
            className="h-12 w-full text-base"
            variant="primary"
          >
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword
