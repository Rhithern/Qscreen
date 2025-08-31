'use client'

import { Button, ButtonProps } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { forwardRef } from 'react'

interface AsyncButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
}

export const AsyncButton = forwardRef<HTMLButtonElement, AsyncButtonProps>(
  ({ children, loading = false, loadingText, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? loadingText || children : children}
      </Button>
    )
  }
)

AsyncButton.displayName = 'AsyncButton'
