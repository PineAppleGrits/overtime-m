import { Card, CardContent } from '@/components/ui/card'
import { CalendarX2 } from 'lucide-react'

export function MyMatchesEmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <CalendarX2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold text-foreground">
          Sin partidos asignados
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Todavía no tenés partidos asignados. Cuando un administrador te asigne
          un partido, lo vas a ver acá.
        </p>
      </CardContent>
    </Card>
  )
}
