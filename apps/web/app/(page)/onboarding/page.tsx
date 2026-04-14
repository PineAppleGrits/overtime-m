import { getProfile } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { OnboardingContent } from './OnboardingContent'

export default async function OnboardingPage() {
  const profile = await getProfile()
  if (!profile) redirect('/')
  if (profile.documentNumber) redirect('/')
  return <OnboardingContent profileName={profile.name ?? ''} />
}
