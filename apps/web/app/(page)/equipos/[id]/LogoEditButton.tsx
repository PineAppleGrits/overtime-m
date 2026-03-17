'use client'

import { useRef, useTransition } from 'react'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// TODO: Reemplazar con el endpoint real cuando esté disponible
// Endpoint esperado: PATCH /teams/:id/logo (multipart/form-data)
async function uploadTeamLogo(teamId: string, file: File): Promise<void> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/${teamId}/logo`, {
    method: 'PATCH',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!res.ok) throw new Error('Upload failed')
}

export function LogoEditButton({ teamId }: { teamId: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    startTransition(async () => {
      try {
        await uploadTeamLogo(teamId, file)
        toast.success('Logo actualizado')
        router.refresh()
      } catch {
        toast.error('No se pudo actualizar el logo')
      }
    })
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        title="Cambiar logo"
        className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#181525]/90 border border-white/20 text-white/60 hover:text-white hover:bg-[#292548] transition-colors disabled:opacity-50"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </>
  )
}
