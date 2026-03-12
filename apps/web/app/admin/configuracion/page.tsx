import siteConfigService from '@/modules/site-config/SiteConfigService'
import { ConfiguracionContent } from '@/modules/admin/components/configuracion/ConfiguracionContent'

export default async function ConfiguracionPage() {
  let initialData: { data: null; error: string | null } = { data: null, error: null }

  try {
    const response = await siteConfigService.getConfig()
    initialData.data = response.data ?? response ?? null
  } catch {
    initialData.error = 'Error al cargar la configuración'
  }

  return <ConfiguracionContent initialData={initialData} />
}
