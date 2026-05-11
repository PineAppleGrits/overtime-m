import { ErrorCode, actionFailure } from '@/modules/common/errors'
import type { Profile } from '@/providers/AuthProvider'
import { getProfile } from './session'
import { hasAdminRole } from './hasAdminRole'

type AuthFailure = { ok: false; error: ReturnType<typeof actionFailure> }
type AuthSuccess = { ok: true; profile: Profile }
export type AuthResult = AuthFailure | AuthSuccess

export async function requireAuth(opts?: { admin?: boolean }): Promise<AuthResult> {
  const profile = await getProfile()
  if (!profile) return { ok: false, error: actionFailure(ErrorCode.NOT_AUTHENTICATED) }
  if (opts?.admin && !hasAdminRole(profile)) {
    return { ok: false, error: actionFailure(ErrorCode.NOT_AUTHORIZED) }
  }
  return { ok: true, profile }
}
