'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/modules/admin/components/PageHeader'
import { DataTable, Column } from '@/modules/admin/components/DataTable'
import { ConfirmDialog } from '@/modules/admin/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import teamService from '@/modules/admin/services/browser/teamService'
import { toast } from 'sonner'
import { MoreHorizontal, Pencil, Trash2, Users, Search } from 'lucide-react'

interface TeamRow {
  id: string
  name: string
  slug: string
  logoUrl?: string
  sportName?: string
  category?: string
  parentTeamName?: string
  playersCount?: number
  ownerName?: string
  createdAt: string
}

export default function TeamsPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<TeamRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    try {
      const response = await teamService.getTeams({ page, limit: 10 })
      setTeams(response.data?.data ?? response.data ?? [])
      setTotalPages(response.data?.meta?.totalPages ?? 1)
    } catch {
      toast.error('Error al cargar equipos')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await teamService.deleteTeam(deleteId)
      toast.success('Equipo eliminado')
      fetchTeams()
    } catch {
      toast.error('Error al eliminar equipo')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const filteredTeams = teams.filter((t) =>
    search ? t.name.toLowerCase().includes(search.toLowerCase()) : true
  )

  const columns: Column<TeamRow>[] = [
    {
      key: 'name',
      label: 'Equipo',
      render: (t) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={t.logoUrl} alt={t.name} />
            <AvatarFallback className="text-xs">{t.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{t.name}</p>
            {t.category && (
              <p className="text-xs text-muted-foreground">Categoría: {t.category}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'parentTeamName',
      label: 'Equipo padre',
      render: (t) => <span className="text-sm">{t.parentTeamName ?? '-'}</span>,
    },
    { key: 'sportName', label: 'Disciplina' },
    {
      key: 'ownerName',
      label: 'Dueño',
      render: (t) => <span className="text-sm">{t.ownerName ?? '-'}</span>,
    },
    {
      key: 'playersCount',
      label: 'Jugadores',
      render: (t) => (
        <span className="text-sm">{t.playersCount ?? 0}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-10',
      render: (t) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/admin/equipos/${t.id}`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/admin/equipos/${t.id}?tab=players`)}>
              <Users className="mr-2 h-4 w-4" />
              Jugadores
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(t.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Equipos"
        description="Gestiona los equipos. Los equipos pueden tener categorías (ej: Barcelona A, Barcelona B) y compartir logo."
        createHref="/admin/equipos/nuevo"
        createLabel="Nuevo equipo"
      />

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar equipos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredTeams}
        loading={loading}
        emptyMessage="No hay equipos registrados"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar equipo"
        description="¿Estás seguro de eliminar este equipo? Se eliminará toda la información asociada."
        variant="destructive"
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
