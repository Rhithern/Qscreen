import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}

interface ToastState {
  toasts: Toast[]
}

let toastCount = 0

export function useToast() {
  const [state, setState] = useState<ToastState>({ toasts: [] })

  const toast = useCallback(({ ...props }: Omit<Toast, 'id'>) => {
    const id = (++toastCount).toString()
    const toast: Toast = {
      ...props,
      id,
      duration: props.duration ?? 5000,
    }

    setState((prevState) => ({
      toasts: [...prevState.toasts, toast],
    }))

    // Auto remove after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        setState((prevState) => ({
          toasts: prevState.toasts.filter((t) => t.id !== id),
        }))
      }, toast.duration)
    }

    return {
      id,
      dismiss: () => {
        setState((prevState) => ({
          toasts: prevState.toasts.filter((t) => t.id !== id),
        }))
      },
    }
  }, [])

  const dismiss = useCallback((toastId: string) => {
    setState((prevState) => ({
      toasts: prevState.toasts.filter((t) => t.id !== toastId),
    }))
  }, [])

  return {
    toast,
    dismiss,
    toasts: state.toasts,
  }
}
