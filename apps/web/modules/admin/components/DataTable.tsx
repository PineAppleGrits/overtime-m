'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react'

export interface Column<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  emptyIcon?: React.ReactNode
  page?: number
  total?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  onRowClick?: (item: T) => void
  /** Accessible label for the table */
  'aria-label'?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends { id?: string; [key: string]: any }>({
  columns,
  data,
  loading,
  emptyMessage = 'No hay datos para mostrar',
  emptyIcon,
  page = 1,
  total,
  totalPages = 1,
  onPageChange,
  onRowClick,
  'aria-label': ariaLabel = 'Tabla de datos',
}: DataTableProps<T>) {
  const limit = 10
  const startRow = (page - 1) * limit + 1
  const endRow = Math.min(page * limit, total ?? data.length)

  return (
    <div className="rounded-xl border border-[#e8e6e1] bg-white overflow-hidden">
      <div className="overflow-x-auto">
      <Table aria-label={ariaLabel}>
        <TableHeader>
          <TableRow className="bg-[#f7f6f4] hover:bg-[#f7f6f4]">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                scope="col"
                className={`text-[11px] font-semibold uppercase tracking-wider text-[#6b6a72] h-10 ${col.className ?? ''}`}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            // Inline skeleton rows
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((col, j) => (
                  <TableCell key={col.key} className={col.className}>
                    <div
                      className={`animate-pulse rounded bg-muted h-4 ${j === 0 ? 'w-40' : 'w-24'}`}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : data.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  {emptyIcon ?? (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0eeeb]">
                      <Inbox className="h-5 w-5 text-[#9b99a6]" />
                    </div>
                  )}
                  <p className="text-sm font-medium text-[#6b6a72]">{emptyMessage}</p>
                  <p className="text-xs text-[#9b99a6]">Cuando se creen registros, van a aparecer acá.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, idx) => (
              <TableRow
                key={item.id ?? String(idx)}
                className={
                  onRowClick
                    ? 'cursor-pointer transition-colors hover:bg-[#fafaf8]'
                    : 'transition-colors hover:bg-[#fafaf8]'
                }
                onClick={() => onRowClick?.(item)}
                {...(onRowClick ? {
                  role: 'button' as const,
                  tabIndex: 0,
                  onKeyDown: (e: React.KeyboardEvent<HTMLTableRowElement>) => {
                    if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
                      e.preventDefault()
                      onRowClick(item)
                    }
                  },
                } : {})}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={`text-[13px] ${col.className ?? ''}`}>
                    {col.render ? col.render(item) : (item[col.key] as React.ReactNode)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>

      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between border-t border-[#e8e6e1] px-4 py-3 bg-[#fafaf8]">
          <p className="text-[12px] text-[#9b99a6]">
            {total != null ? (
              <>Mostrando {startRow}–{endRow} de {total}</>
            ) : (
              <>Página {page} de {totalPages}</>
            )}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="h-8 w-8 p-0 border-[#e8e6e1]"
              aria-label="Pagina anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {/* Page number pills */}
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  aria-label={`Ir a pagina ${pageNum}`}
                  className={`h-8 w-8 p-0 text-[12px] ${
                    pageNum === page
                      ? 'bg-[#0f0e13] text-white hover:bg-[#0f0e13]/90'
                      : 'border-[#e8e6e1]'
                  }`}
                >
                  {pageNum}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="h-8 w-8 p-0 border-[#e8e6e1]"
              aria-label="Pagina siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
