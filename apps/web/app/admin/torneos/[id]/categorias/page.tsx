import categoryService from '@/modules/tournament/CategoryService'
import sportService from '@/modules/sport/SportService'
import { CategoriesContent } from '@/modules/admin/components/torneos/CategoriesContent'

export default async function CategoriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [categoriesResult, sportsResult] = await Promise.allSettled([
    categoryService.getCategories(id),
    sportService.getSports(),
  ])

  const initialCategories =
    categoriesResult.status === 'fulfilled'
      ? { data: categoriesResult.value.data ?? categoriesResult.value ?? [], error: null }
      : { data: [], error: 'Error al cargar categorías' }

  const sports: { id: string; name: string; code: string }[] =
    sportsResult.status === 'fulfilled'
      ? (sportsResult.value.data ?? sportsResult.value ?? [])
      : []

  return <CategoriesContent tournamentId={id} initialCategories={initialCategories} sports={sports} />
}
