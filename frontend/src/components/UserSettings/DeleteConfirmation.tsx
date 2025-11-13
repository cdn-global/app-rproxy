import { useMutation, useQueryClient } from "@tanstack/react-query"

import { type ApiError, UsersService } from "../../client"
import useAuth from "../../hooks/useAuth"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DeleteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DeleteConfirmation = ({ open, onOpenChange }: DeleteProps) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const { logout } = useAuth()

  const mutation = useMutation({
    mutationFn: () => UsersService.deleteUserMe(),
    onSuccess: () => {
      showToast(
        "Success",
        "Your account has been successfully deleted.",
        "success",
      )
      logout()
      onOpenChange(false)
    },
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border border-destructive/30 bg-white/95 shadow-[0_32px_80px_-48px_rgba(220,38,38,0.45)] backdrop-blur-xl dark:border-destructive/60 dark:bg-slate-900/95">
        <DialogHeader>
          <DialogTitle className="text-xl">Delete account</DialogTitle>
          <DialogDescription>
            This action is permanent and will remove all associated data. Please confirm before proceeding.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          All your account data will be permanently deleted. If you&apos;re certain, confirm below. This cannot be undone.
        </p>
        <DialogFooter className="pt-4">
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="rounded-full"
          >
            {mutation.isPending ? "Deleting…" : "Confirm"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteConfirmation
