import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  type ApiError,
  type UserPublic,
  type UserUpdateMe,
  UsersService,
} from "../../client"
import useAuth from "../../hooks/useAuth"
import useCustomToast from "../../hooks/useCustomToast"
import { emailPattern, handleError } from "../../utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const UserInformation = () => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const [isEditing, setIsEditing] = useState(false)
  const { user: currentUser } = useAuth()
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { isSubmitting, errors, isDirty },
  } = useForm<UserPublic>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      full_name: currentUser?.full_name,
      email: currentUser?.email,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: UserUpdateMe) =>
      UsersService.updateUserMe({ requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "User updated successfully.", "success")
      setIsEditing(false)
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries()
    },
  })

  const onSubmit: SubmitHandler<UserUpdateMe> = async (data) => {
    mutation.mutate(data, {
      onSuccess: () => {
        reset({
          full_name: data.full_name ?? "",
          email: data.email ?? currentUser?.email ?? "",
        })
      },
    })
  }

  const onCancel = () => {
    reset()
    setIsEditing(false)
  }

  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white/80 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-[0_30px_80px_-45px_rgba(15,23,42,0.65)]">
      <div className="space-y-2 border-b border-slate-200/70 p-6 dark:border-slate-700/60">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Profile details</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Keep your personal information up to date so we can reach you when it matters.
        </p>
      </div>
      <div className="p-6">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Full name
            </Label>
            {isEditing ? (
              <Input
                id="full_name"
                {...register("full_name", { maxLength: 64 })}
                placeholder="Enter your full name"
                autoComplete="name"
              />
            ) : (
              <p className="text-sm font-medium text-foreground">
                {currentUser?.full_name || "Not provided"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Email address
            </Label>
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: emailPattern,
                  })}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {errors.email ? (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm font-medium text-foreground">{currentUser?.email}</p>
            )}
          </div>

          {isEditing ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                disabled={isSubmitting || !isDirty || !getValues("email")}
              >
                {isSubmitting ? "Saving…" : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
              Edit profile
            </Button>
          )}
        </form>
      </div>
    </div>
  )
}

export default UserInformation
