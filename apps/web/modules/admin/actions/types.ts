/**
 * Shared return type for all server actions.
 */
export interface ActionResult<T = void> {
  success: boolean
  error?: string
  data?: T
}
