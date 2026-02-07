import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export interface StorageBucket {
  id: string
  user_id: string
  bucket_name: string
  region: string
  storage_class: string
  status: string
  storage_backend: string
  endpoint_url: string | null
  storage_gb_used: number
  object_count: number
  monthly_rate_per_gb: number
  created_at: string
}

export interface StorageBucketsResponse {
  data: StorageBucket[]
  count: number
}

export interface CreateBucketRequest {
  bucket_name: string
  region?: string
  storage_class?: string
  storage_backend?: string
}

export interface StorageUsageSummary {
  total_buckets: number
  total_storage_gb: number
  total_objects: number
  monthly_cost: number
  by_bucket: Array<{
    bucket_id: string
    bucket_name: string
    storage_gb: number
    objects: number
    monthly_cost: number
  }>
}

const API_BASE = "/v2/storage"

function getAuthHeaders() {
  const token = localStorage.getItem("access_token")
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

export function useStorageBuckets() {
  return useQuery<StorageBucketsResponse>({
    queryKey: ["storage-buckets"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/buckets`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        throw new Error("Failed to fetch storage buckets")
      }
      return res.json()
    },
  })
}

export function useStorageUsageSummary() {
  return useQuery<StorageUsageSummary>({
    queryKey: ["storage-usage-summary"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/usage/summary`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        throw new Error("Failed to fetch storage usage summary")
      }
      return res.json()
    },
  })
}

export function useCreateBucket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateBucketRequest) => {
      const res = await fetch(`${API_BASE}/buckets`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || "Failed to create bucket")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-buckets"] })
      queryClient.invalidateQueries({ queryKey: ["storage-usage-summary"] })
    },
  })
}

export function useDeleteBucket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bucketId: string) => {
      const res = await fetch(`${API_BASE}/buckets/${bucketId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || "Failed to delete bucket")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-buckets"] })
      queryClient.invalidateQueries({ queryKey: ["storage-usage-summary"] })
    },
  })
}
