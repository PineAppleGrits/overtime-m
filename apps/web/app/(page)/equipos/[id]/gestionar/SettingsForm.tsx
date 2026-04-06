'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { updateTeamNameAction, deleteTeamAction } from '@/modules/profile/actions/teamActions'

const nameSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres'),
})

type NameFormData = z.infer<typeof nameSchema>

interface SettingsFormProps {
  teamId: string
  teamName: string
  sportName: string
  captainName: string | null
}

export function SettingsForm({ teamId, teamName, sportName, captainName }: SettingsFormProps) {
  const router = useRouter()
  const [isSaving, startSaveTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: teamName },
  })

  function onSubmitName(data: NameFormData) {
    startSaveTransition(async () => {
      const result = await updateTeamNameAction(teamId, data)
      if (result.success) {
        toast.success('Nombre del equipo actualizado')
      } else {
        toast.error(result.error ?? 'No se pudo actualizar el nombre')
      }
    })
  }

  function handleDeleteConfirm() {
    startDeleteTransition(async () => {
      const result = await deleteTeamAction(teamId)
      if (result.success) {
        toast.success('Equipo eliminado')
        setDeleteDialogOpen(false)
        router.push('/profile/equipos')
      } else {
        toast.error(result.error ?? 'No se pudo eliminar el equipo')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Información básica */}
      <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-6">
        <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">
          Información básica
        </h2>
        <form onSubmit={handleSubmit(onSubmitName)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm text-white/70 mb-1">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className="w-full rounded-lg border border-ot-light-blue/40 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-ot-orange/50"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Disciplina</label>
            <input
              type="text"
              value={sportName}
              readOnly
              className="w-full rounded-lg border border-ot-light-blue/40 bg-white/5 px-3 py-2 text-sm text-white/50 cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="bg-ot-orange hover:bg-ot-orange/90 text-white font-semibold rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      {/* Capitán del equipo */}
      <div className="rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-6">
        <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">
          Capitán del equipo
        </h2>
        <p className="text-sm text-white/70">
          Actual:{' '}
          <span className="text-white font-medium">
            {captainName ?? 'Sin capitán asignado'}
          </span>
        </p>
        <button
          disabled
          className="mt-3 border border-ot-light-blue/40 text-white/40 rounded-lg px-4 py-2 text-sm cursor-not-allowed"
        >
          Cambiar capitán (próximamente)
        </button>
      </div>

      {/* Zona de peligro */}
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
        <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          Zona de peligro
        </h2>
        <p className="text-sm text-white/50 mb-3">
          Eliminar equipo. Esta acción no se puede deshacer.
        </p>
        <button
          onClick={() => setDeleteDialogOpen(true)}
          disabled={isDeleting}
          className="border border-red-500/40 text-red-400 hover:bg-red-500/10 rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50 cursor-pointer"
        >
          Eliminar equipo
        </button>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Eliminar equipo"
        description={`¿Estás seguro de que querés eliminar "${teamName}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />
    </div>
  )
}
