import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import useCustomToast from "../../hooks/useCustomToast"
import { oneClickApps } from "../../data/oneClickApps"

interface CreateServerProps {
  isOpen: boolean
  onClose: () => void
}

interface ServerCreateForm {
  name: string
  server_type: string
  hosting_provider: string
  cpu_cores: number
  memory_gb: number
  gpu_type?: string
  aws_instance_type?: string
  aws_region?: string
  app_slug?: string
}

const CreateServer = ({ isOpen, onClose }: CreateServerProps) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ServerCreateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      server_type: "ssh",
      hosting_provider: "docker",
      cpu_cores: 2,
      memory_gb: 4,
      gpu_type: "",
      aws_instance_type: "t3.micro",
      aws_region: "us-east-1",
      app_slug: "",
    },
  })

  const hostingProvider = watch("hosting_provider")

  const mutation = useMutation({
    mutationFn: async (data: ServerCreateForm) => {
      const response = await fetch("/v2/servers/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          ...data,
          gpu_type: data.gpu_type || null,
          aws_instance_type: data.hosting_provider === "aws" ? data.aws_instance_type : null,
          aws_region: data.hosting_provider === "aws" ? data.aws_region : null,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to create server")
      }
      return response.json()
    },
    onSuccess: () => {
      showToast("Success!", "Server created successfully.", "success")
      reset()
      onClose()
    },
    onError: (err: Error) => {
      showToast("Error", err.message, "error")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["remote-servers"] })
    },
  })

  const onSubmit: SubmitHandler<ServerCreateForm> = (data) => {
    mutation.mutate(data)
  }

  const handleCancel = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? handleCancel() : undefined)}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create Server</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="name">Server Name</Label>
            <Input
              id="name"
              {...register("name", { required: "Server name is required" })}
              placeholder="my-server"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="server_type">Server Type</Label>
              <select
                id="server_type"
                {...register("server_type")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="ssh">SSH Server</option>
                <option value="gpu">GPU Server</option>
                <option value="inference">Inference Server</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hosting_provider">Hosting Provider</Label>
              <select
                id="hosting_provider"
                {...register("hosting_provider")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="docker">Docker (Shared)</option>
                <option value="aws">AWS EC2 (Dedicated)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="app_slug">One-Click App (Optional)</Label>
            <select
              id="app_slug"
              {...register("app_slug")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">-- None (OS Only) --</option>
              {oneClickApps.map((app) => (
                <option key={app.id} value={app.slug}>
                  {app.name} - {app.description.substring(0, 50)}...
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cpu_cores">CPU Cores</Label>
              <Input
                id="cpu_cores"
                type="number"
                {...register("cpu_cores", { valueAsNumber: true, min: 1, max: 96 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memory_gb">Memory (GB)</Label>
              <Input
                id="memory_gb"
                type="number"
                {...register("memory_gb", { valueAsNumber: true, min: 1, max: 768 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gpu_type">GPU Type (optional)</Label>
            <Input
              id="gpu_type"
              {...register("gpu_type")}
              placeholder="e.g. nvidia-t4, nvidia-a100"
            />
          </div>

          {hostingProvider === "aws" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="aws_instance_type">AWS Instance Type</Label>
                <select
                  id="aws_instance_type"
                  {...register("aws_instance_type")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="t3.micro">t3.micro (2 vCPU, 1 GB)</option>
                  <option value="t3.small">t3.small (2 vCPU, 2 GB)</option>
                  <option value="t3.medium">t3.medium (2 vCPU, 4 GB)</option>
                  <option value="t3.large">t3.large (2 vCPU, 8 GB)</option>
                  <option value="t3.xlarge">t3.xlarge (4 vCPU, 16 GB)</option>
                  <option value="m5.large">m5.large (2 vCPU, 8 GB)</option>
                  <option value="m5.xlarge">m5.xlarge (4 vCPU, 16 GB)</option>
                  <option value="c5.xlarge">c5.xlarge (4 vCPU, 8 GB)</option>
                  <option value="g4dn.xlarge">g4dn.xlarge (4 vCPU, 16 GB, T4 GPU)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aws_region">AWS Region</Label>
                <select
                  id="aws_region"
                  {...register("aws_region")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">EU (Ireland)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                </select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3">
            <Button variant="primary" type="submit" isLoading={isSubmitting} loadingText="Creating">
              Create Server
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateServer
