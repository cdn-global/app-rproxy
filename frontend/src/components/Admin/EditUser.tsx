import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  type ApiError,
  type UserPublic as BaseUserPublic, // Rename to avoid conflict
  type UserUpdate as BaseUserUpdate,
  UsersService,
} from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import { emailPattern, handleError } from "../../utils"

// Extend UserPublic to match database schema
interface ExtendedUserPublic extends BaseUserPublic {
  has_subscription?: boolean
  is_trial?: boolean
  is_deactivated?: boolean
}

interface UserUpdate extends BaseUserUpdate {
  has_subscription?: boolean
  is_trial?: boolean
  is_deactivated?: boolean
}

interface EditUserProps {
  user: ExtendedUserPublic
  isOpen: boolean
  onClose: () => void
}

interface UserUpdateForm extends UserUpdate {
  confirm_password: string
}

const EditUser = ({ user, isOpen, onClose }: EditUserProps) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()

  console.log("Initial user prop:", JSON.stringify(user, null, 2))

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UserUpdateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      ...user,
      has_subscription: user.has_subscription || false,
      is_trial: user.is_trial || false,
      is_deactivated: user.is_deactivated || false,
    },
  })

  useEffect(() => {
    console.log("Resetting form with user:", JSON.stringify(user, null, 2))
    reset({
      ...user,
      has_subscription: user.has_subscription || false,
      is_trial: user.is_trial || false,
      is_deactivated: user.is_deactivated || false,
    })
  }, [user, reset])

  const mutation = useMutation({
    mutationFn: (data: UserUpdateForm) => {
      const requestData: UserUpdate = {
        ...data,
        has_subscription: data.has_subscription || false,
        is_trial: data.is_trial || false,
        is_deactivated: data.is_deactivated || false,
      }
      ;(requestData as any).confirm_password = undefined
      console.log("Sending to API:", JSON.stringify(requestData, null, 2))
      return UsersService.updateUser({
        userId: user.id,
        requestBody: requestData,
      })
    },
    onSuccess: (response) => {
      console.log("API response:", JSON.stringify(response, null, 2))
      showToast("Success!", "User updated successfully.", "success")
      queryClient.refetchQueries({ queryKey: ["users"] })
      onClose()
    },
    onError: (err: ApiError) => {
      console.log("Mutation error:", err)
      handleError(err, showToast)
    },
    onSettled: () => {
      console.log("Invalidating users query")
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const onSubmit: SubmitHandler<UserUpdateForm> = async (data) => {
    if (data.password === "") {
      data.password = undefined
    }
    console.log("Form submitted with data:", JSON.stringify(data, null, 2))
    mutation.mutate(data)
  }

  const onCancel = () => {
    console.log("Cancel clicked, resetting form")
    reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              {...register("email", {
                required: "Email is required",
                pattern: emailPattern,
              })}
              placeholder="Email"
              type="email"
            />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" {...register("full_name")} type="text" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Set Password</Label>
            <Input
              id="password"
              {...register("password", {
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
              placeholder="Password"
              type="password"
            />
            {errors.password ? (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm Password</Label>
            <Input
              id="confirm_password"
              {...register("confirm_password", {
                validate: (value) =>
                  value === getValues().password || "The passwords do not match",
              })}
              placeholder="Password"
              type="password"
            />
            {errors.confirm_password ? (
              <p className="text-sm text-destructive">
                {errors.confirm_password.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-input"
                {...register("is_superuser")}
              />
              Is superuser?
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-input"
                {...register("is_active")}
              />
              Is active?
            </label>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-input"
                {...register("has_subscription")}
              />
              Has SERP Tool
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-input"
                {...register("is_trial")}
              />
              Is SERP Trial
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-input"
                {...register("is_deactivated")}
              />
              Is SERP Deactivated
            </label>
          </div>

          <DialogFooter className="gap-3">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              loadingText="Saving"
              disabled={!isDirty}
            >
              Save
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditUser
