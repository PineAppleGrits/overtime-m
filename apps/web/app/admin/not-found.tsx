import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function AdminNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f0efe9]">
        <FileQuestion className="h-7 w-7 text-[#c4c2cc]" />
      </div>
      <h1 className="text-lg font-semibold text-[#0f0e13]">Página no encontrada</h1>
      <p className="mt-1 text-[13px] text-[#9b99a6]">
        La página que buscás no existe o fue movida.
      </p>
      <Link
        href="/admin"
        className="mt-6 inline-flex items-center rounded-lg bg-[#ff3b2f] px-4 py-2 text-sm font-medium text-white hover:bg-[#e5352a] transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
