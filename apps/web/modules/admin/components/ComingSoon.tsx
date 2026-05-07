import { Hammer } from 'lucide-react'

interface ComingSoonProps {
  message?: string
}

export function ComingSoon({
  message = 'Esta sección está en construcción.',
}: ComingSoonProps) {
  return (
    <div className="rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#fafaf8]">
        <Hammer className="h-6 w-6 text-[#c4c2cc]" />
      </div>
      <p className="text-[13px] font-medium text-[#6b6a72]">Próximamente</p>
      <p className="mt-1 text-[12px] text-[#9b99a6]">{message}</p>
    </div>
  )
}
