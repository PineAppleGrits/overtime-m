import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PageHeaderProps {
  title: string
  description?: string
  backHref?: string
  createHref?: string
  createLabel?: string
  onCreateClick?: () => void
  actions?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  backHref,
  createHref,
  createLabel = 'Crear nuevo',
  onCreateClick,
  actions,
}: PageHeaderProps) {
  return (
    <header className="mb-6 flex items-start justify-between">
      <div className="flex items-start gap-3">
        {backHref && (
          <Button variant="ghost" size="icon" asChild className="mt-0.5" aria-label="Volver">
            <Link href={backHref}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        {createHref && (
          <Button asChild>
            <Link href={createHref}>
              <Plus className="mr-2 size-4" />
              {createLabel}
            </Link>
          </Button>
        )}
        {onCreateClick && (
          <Button onClick={onCreateClick}>
            <Plus className="mr-2 size-4" />
            {createLabel}
          </Button>
        )}
      </div>
    </header>
  )
}
