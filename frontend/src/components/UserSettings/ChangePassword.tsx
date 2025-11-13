import { useMutation } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import { type ApiError, type UpdatePassword, UsersService } from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import { confirmPasswordRules, handleError, passwordRules } from "../../utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UpdatePasswordForm extends UpdatePassword {
  confirm_password: string
}

const ChangePassword = () => {
  const showToast = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordForm>({
    mode: "onBlur",
    criteriaMode: "all",
  })

  const mutation = useMutation({
    mutationFn: (data: UpdatePassword) =>
      UsersService.updatePasswordMe({ requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "Password updated successfully.", "success")
      reset()
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
  })

  const onSubmit: SubmitHandler<UpdatePasswordForm> = async (data) => {
    mutation.mutate(data)
  }

  const errorText = (field?: { message?: string }) =>
    field?.message ? (
      <p className="text-xs text-destructive">{field.message}</p>
    ) : null

  return (
    <Card className="border border-slate-200/70 bg-white/80 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.65)]">
      <CardHeader className="space-y-2">
        <CardTitle className="text-xl">Change password</CardTitle>
        <CardDescription>
          Update your account password to keep your workspace secure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="current_password" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Current password
            </Label>
            <Input
              id="current_password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("current_password", {
                required: "Current password is required",
              })}
            />
            {errorText(errors.current_password)}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_password" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              New password
            </Label>
            <Input
              id="new_password"
              type="password"
              autoComplete="new-password"
              placeholder="Create a strong password"
              {...register("new_password", passwordRules())}
            />
            {errorText(errors.new_password)}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Confirm password
            </Label>
            <Input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat new password"
              {...register("confirm_password", confirmPasswordRules(getValues))}
            />
            {errorText(errors.confirm_password)}
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting || mutation.isPending ? "Saving…" : "Save password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default ChangePassword
