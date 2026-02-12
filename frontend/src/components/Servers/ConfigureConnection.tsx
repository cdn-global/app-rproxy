import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import useCustomToast from "../../hooks/useCustomToast"

interface ConfigureConnectionProps {
  isOpen: boolean
  onClose: () => void
  serverId: string
  serverName: string
}

interface ConnectionForm {
  ssh_host: string
  ssh_port: number
  ssh_username: string
  private_key: string
}

const ConfigureConnection = ({
  isOpen,
  onClose,
  serverId,
  serverName,
}: ConfigureConnectionProps) => {
  const showToast = useCustomToast()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConnectionForm>({
    defaultValues: {
      ssh_host: "",
      ssh_port: 22,
      ssh_username: "root",
      private_key: "",
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: ConnectionForm) => {
      const response = await fetch(`/v2/servers/${serverId}/configure`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.detail || "Failed to configure connection")
      }
      return response.json()
    },
    onSuccess: () => {
      showToast("Success", "Connection configured. You can now open the terminal.", "success")
      queryClient.invalidateQueries({ queryKey: ["remote-servers"] })
      reset()
      onClose()
    },
    onError: (err: Error) => showToast("Error", err.message, "error"),
  })

  const onSubmit: SubmitHandler<ConnectionForm> = (data) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure SSH Connection</DialogTitle>
          <DialogDescription>
            Enter SSH credentials for <span className="font-semibold">{serverName}</span> to enable terminal access.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="ssh_host">Host / IP</Label>
              <Input
                id="ssh_host"
                placeholder="192.168.1.100"
                {...register("ssh_host", { required: "Host is required" })}
              />
              {errors.ssh_host && (
                <p className="text-xs text-destructive">{errors.ssh_host.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ssh_port">Port</Label>
              <Input
                id="ssh_port"
                type="number"
                {...register("ssh_port", { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ssh_username">Username</Label>
            <Input
              id="ssh_username"
              placeholder="root"
              {...register("ssh_username", { required: "Username is required" })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="private_key">Private Key (PEM)</Label>
            <Textarea
              id="private_key"
              placeholder={"-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----"}
              rows={6}
              className="font-mono text-xs"
              {...register("private_key", { required: "Private key is required" })}
            />
            {errors.private_key && (
              <p className="text-xs text-destructive">{errors.private_key.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Connection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ConfigureConnection
