import { AdminDetailSkeleton } from '@/modules/admin/components/AdminTableSkeleton'

export default function ConfiguracionLoading() {
  return (
    <AdminDetailSkeleton
      title="Configuración del sitio"
      description="Personaliza la apariencia, datos de contacto y métodos de pago"
      showBack={false}
      cards={2}
    />
  )
}
