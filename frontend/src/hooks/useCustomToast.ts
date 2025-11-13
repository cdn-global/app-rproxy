// src/hooks/useCustomToast.ts
import { useCallback, useRef } from "react"
import { toast } from "sonner"

type ToastStatus = "info" | "warning" | "success" | "error"

type ToastMethod = (message: string, options?: { description?: string; duration?: number }) => string | number

const statusToMethod: Record<ToastStatus, ToastMethod> = {
  info: (message, options) => toast.info(message, options),
  warning: (message, options) => toast.warning(message, options),
  success: (message, options) => toast.success(message, options),
  error: (message, options) => toast.error(message, options),
}

const useCustomToast = () => {
  const toastIdRef = useRef<string | number | null>(null)

  const showToast = useCallback(
    (title: string, description: string, status: ToastStatus) => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current)
      }

      const show = statusToMethod[status] ?? toast.info
      const id = show(title, { description, duration: 4000 })
      toastIdRef.current = id
    },
    [],
  )

  return showToast
}

export default useCustomToast
