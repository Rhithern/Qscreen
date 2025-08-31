import { useState, useCallback } from 'react'

interface AsyncActionState {
  loading: boolean
  error: string | null
}

interface AsyncActionReturn<T> {
  run: (...args: any[]) => Promise<T>
  loading: boolean
  error: string | null
  reset: () => void
}

export function useAsyncAction<T>(
  action: (...args: any[]) => Promise<T>
): AsyncActionReturn<T> {
  const [state, setState] = useState<AsyncActionState>({
    loading: false,
    error: null,
  })

  const run = useCallback(
    async (...args: any[]): Promise<T> => {
      setState({ loading: true, error: null })
      
      try {
        const result = await action(...args)
        setState({ loading: false, error: null })
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred'
        setState({ loading: false, error: errorMessage })
        throw error
      }
    },
    [action]
  )

  const reset = useCallback(() => {
    setState({ loading: false, error: null })
  }, [])

  return {
    run,
    loading: state.loading,
    error: state.error,
    reset,
  }
}
