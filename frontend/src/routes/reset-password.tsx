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
    <div className="container relative grid h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Logo />
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              “This library has saved me countless hours of work and helped me
              deliver stunning designs to my clients faster than ever before.”
            </p>
            <footer className="text-sm">Roaming Proxy</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Reset your password
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your new password below.
            </p>
          </div>
          <div className="grid gap-6">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    {...register("new_password", passwordRules())}
                    autoComplete="new-password"
                  />
                  {errors.new_password && (
                    <p className="text-sm text-gray-500">
                      {errors.new_password.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm_password">Confirm Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    {...register(
                      "confirm_password",
                      confirmPasswordRules(getValues),
                    )}
                    autoComplete="new-password"
                  />
                  {errors.confirm_password && (
                    <p className="text-sm text-gray-500">
                      {errors.confirm_password.message}
                    </p>
                  )}
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Resetting..." : "Reset password"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
