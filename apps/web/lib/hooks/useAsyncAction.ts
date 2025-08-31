import { useState, useCallback } from 'react'

// Simple toast fallback if sonner is not available
const toast = {
  success: (message: string) => console.log('✓', message),
  error: (message: string) => console.error('✗', message)
}

interface AsyncActionOptions {
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
  successMessage?: string
  showToast?: boolean
}

interface AsyncActionState {
  isLoading: boolean
  error: string | null
}

export function useAsyncAction<T extends any[], R>(
  action: (...args: T) => Promise<R | { error: string }>,
  options: AsyncActionOptions = {}
) {
  const [state, setState] = useState<AsyncActionState>({
    isLoading: false,
    error: null
  })

  const execute = useCallback(async (...args: T) => {
    setState({ isLoading: true, error: null })
    
    try {
      const result = await action(...args)
      
      // Check if result is an error object
      if (result && typeof result === 'object' && 'error' in result) {
        const errorMessage = result.error as string
        setState({ isLoading: false, error: errorMessage })
        
        if (options.showToast !== false) {
          toast.error(errorMessage)
        }
        
        options.onError?.(errorMessage)
        return { success: false, error: errorMessage }
      }
      
      setState({ isLoading: false, error: null })
      
      if (options.successMessage && options.showToast !== false) {
        toast.success(options.successMessage)
      }
      
      options.onSuccess?.(result)
      return { success: true, data: result }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setState({ isLoading: false, error: errorMessage })
      
      if (options.showToast !== false) {
        toast.error(errorMessage)
      }
      
      options.onError?.(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [action, options])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    execute,
    isLoading: state.isLoading,
    error: state.error,
    clearError
  }
}
