'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface UseAsyncActionOptions {
  successMessage?: string
  errorMessage?: string
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

export function useAsyncAction(options: UseAsyncActionOptions = {}) {
  const [loading, setLoading] = useState(false)

  const execute = useCallback(
    async <T>(action: () => Promise<T>): Promise<T | null> => {
      setLoading(true)
      try {
        const result = await action()
        if (options.successMessage) {
          toast.success(options.successMessage)
        }
        options.onSuccess?.()
        return result
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : options.errorMessage ?? 'Ocurrió un error inesperado'
        toast.error(message)
        options.onError?.(error)
        return null
      } finally {
        setLoading(false)
      }
    },
    [options]
  )

  return { loading, execute }
}
