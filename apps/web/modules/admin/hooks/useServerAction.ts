'use client'

import { useCallback, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()

  // Always keep a ref pointing to the latest options so the async callback
  // inside startTransition never calls a stale onSuccess closure.
  const optionsRef = useRef(options)
  optionsRef.current = options

  const execute = useCallback(
    (input: TInput) => {
      startTransition(async () => {
        const result = await action(input)
        if (result.success) {
          if (optionsRef.current.successMessage) toast.success(optionsRef.current.successMessage)
          optionsRef.current.onSuccess?.()
          // Bust the Next.js router cache so navigating back shows fresh data.
          router.refresh()
        } else {
          toast.error(result.error ?? 'Ocurrió un error inesperado')
        }
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [action, startTransition]
  )

  return { execute, isPending }
}
