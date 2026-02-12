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
import { getApiBaseUrl } from "@/lib/utils"
import useCustomToast from "../../hooks/useCustomToast"

interface CreateDatabaseProps {
  isOpen: boolean
  onClose: () => void
}

interface DatabaseCreateForm {
  instance_name: string
  postgres_version: string
  storage_gb: number
  cpu_cores: number
  memory_gb: number
}

const CreateDatabase = ({ isOpen, onClose }: CreateDatabaseProps) => {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DatabaseCreateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      instance_name: "",
      postgres_version: "16",
      storage_gb: 10,
      cpu_cores: 1,
      memory_gb: 2,
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: DatabaseCreateForm) => {
      const response = await fetch(`${getApiBaseUrl()}/v2/database-instances/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to create database")
      }
      return response.json()
    },
    onSuccess: () => {
      showToast("Success!", "Database created successfully.", "success")
      reset()
      onClose()
    },
    onError: (err: Error) => {
      showToast("Error", err.message, "error")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["database-instances"] })
    },
  })

  const onSubmit: SubmitHandler<DatabaseCreateForm> = (data) => {
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
            <DialogTitle>New Database Instance</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="instance_name">Instance Name</Label>
            <Input
              id="instance_name"
              {...register("instance_name", { required: "Instance name is required" })}
              placeholder="my-database"
            />
            {errors.instance_name && (
              <p className="text-sm text-destructive">{errors.instance_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="postgres_version">PostgreSQL Version</Label>
            <select
              id="postgres_version"
              {...register("postgres_version")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="16">PostgreSQL 16 (Latest)</option>
              <option value="15">PostgreSQL 15</option>
              <option value="14">PostgreSQL 14</option>
              <option value="13">PostgreSQL 13</option>
              <option value="12">PostgreSQL 12</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cpu_cores">vCPUs</Label>
              <Input
                id="cpu_cores"
                type="number"
                {...register("cpu_cores", { valueAsNumber: true, min: 1, max: 16 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memory_gb">RAM (GB)</Label>
              <Input
                id="memory_gb"
                type="number"
                {...register("memory_gb", { valueAsNumber: true, min: 1, max: 128 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storage_gb">Storage (GB)</Label>
              <Input
                id="storage_gb"
                type="number"
                {...register("storage_gb", { valueAsNumber: true, min: 1, max: 1000 })}
              />
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button variant="primary" type="submit" isLoading={isSubmitting} loadingText="Creating">
              Create Database
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

export default CreateDatabase
