import { AdminDetailSkeleton } from '@/modules/admin/components/AdminTableSkeleton'

export default function ConfiguracionLoading() {
  return (
    <AdminDetailSkeleton
      title="Configuración"
      description="Configuración general del sitio"
      showBack={false}
      cards={2}
    />
  )
}
