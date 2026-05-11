'use client'

import { useCallback, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getErrorMessage } from '@/modules/common/errors'
import type { ActionResult } from '../actions/types'

const DEFAULT_LOADING_MESSAGE = 'Procesando...'

interface UseServerActionOptions<TData = void> {
  successMessage?: string
  loadingMessage?: string
  onSuccess?: (data?: TData) => void | Promise<void>
}

/**
 * Wraps a server action with `useTransition`, loading state and toast
 * feedback.  Use this instead of `useAsyncAction` for any mutation that
 * goes through a Next.js server action.
 *
 * Toast lifecycle: shows a `toast.loading` immediately, then replaces it
 * with success or error when the action resolves.
 */
export function useServerAction<TInput, TData = void>(
  action: (input: TInput) => Promise<ActionResult<TData>>,
  options: UseServerActionOptions<TData> = {}
) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const optionsRef = useRef(options)
  optionsRef.current = options

  const execute = useCallback(
    (input: TInput) => {
      startTransition(async () => {
        const loadingId = toast.loading(
          optionsRef.current.loadingMessage ?? DEFAULT_LOADING_MESSAGE,
          { dismissible: false }
        )
        try {
          const result = await action(input)
          if (result.success) {
            if (optionsRef.current.successMessage) {
              toast.success(optionsRef.current.successMessage, { id: loadingId })
            } else {
              toast.dismiss(loadingId)
            }
            await optionsRef.current.onSuccess?.(result.data)
            router.refresh()
          } else {
            toast.error(getErrorMessage(result.error), { id: loadingId })
          }
        } catch (err) {
          toast.error(getErrorMessage(undefined), { id: loadingId })
          throw err
        }
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [action, startTransition]
  )

  return { execute, isPending }
}
