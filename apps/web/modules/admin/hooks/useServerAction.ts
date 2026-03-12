'use client'

import { useCallback, useTransition } from 'react'
import { toast } from 'sonner'
import type { ActionResult } from '../actions/types'

interface UseServerActionOptions {
  successMessage?: string
  onSuccess?: () => void
}

/**
 * Wraps a server action with `useTransition`, loading state and toast
 * feedback.  Use this instead of `useAsyncAction` for any mutation that
 * goes through a Next.js server action.
 */
export function useServerAction<TInput, TData = void>(
  action: (input: TInput) => Promise<ActionResult<TData>>,
  options: UseServerActionOptions = {}
) {
  const [isPending, startTransition] = useTransition()

  const execute = useCallback(
    (input: TInput) => {
      startTransition(async () => {
        const result = await action(input)
        if (result.success) {
          if (options.successMessage) toast.success(options.successMessage)
          options.onSuccess?.()
        } else {
          toast.error(result.error ?? 'Ocurrió un error inesperado')
        }
      })
    },
    [action, options, startTransition]
  )

  return { execute, isPending }
}
