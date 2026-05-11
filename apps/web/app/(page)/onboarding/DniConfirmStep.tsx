'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateDocumentNumberAction } from '@/modules/auth/actions/profileActions'
import { useAuth } from '@/providers/AuthProvider'

type ExtractedData = {
  firstName: string
  lastName: string
  documentNumber: string
  birthDate: string
}

export function DniConfirmStep({
  initialData,
}: {
  initialData: ExtractedData
}) {
  const [firstName, setFirstName] = useState(initialData.firstName)
  const [lastName, setLastName] = useState(initialData.lastName)
  const [documentNumber, setDocumentNumber] = useState(
    initialData.documentNumber
  )
  const [birthDate, setBirthDate] = useState(initialData.birthDate)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const { refresh } = useAuth()

  const isValidDni = /^\d{7,8}$/.test(documentNumber.trim())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isValidDni) {
      setError('El DNI debe tener 7 u 8 dígitos numéricos')
      return
    }

    setSubmitting(true)
    const loadingId = toast.loading('Guardando DNI...', { dismissible: false })
    try {
      const result = await updateDocumentNumberAction(documentNumber.trim())
      if (result.success) {
        toast.success('DNI guardado correctamente', { id: loadingId })
        refresh()
        router.push('/')
      } else {
        const message = result.error ?? 'No se pudo actualizar el documento'
        toast.error(message, { id: loadingId })
        setError(message)
      }
    } catch {
      const message = 'Ocurrió un error inesperado. Intentá de nuevo.'
      toast.error(message, { id: loadingId })
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const inputClassName =
    'w-full bg-transparent border border-ot-light-blue/50 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:ring-2 focus:ring-ot-orange/50 focus:border-ot-orange/60 focus:outline-none transition-colors'
  const labelClassName = 'block text-sm text-white/60 mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="firstName" className={labelClassName}>
          Nombre
        </label>
        <input
          id="firstName"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Tu nombre"
          className={inputClassName}
        />
      </div>

      <div>
        <label htmlFor="lastName" className={labelClassName}>
          Apellido
        </label>
        <input
          id="lastName"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Tu apellido"
          className={inputClassName}
        />
      </div>

      <div>
        <label htmlFor="documentNumber" className={labelClassName}>
          Número de documento
        </label>
        <input
          id="documentNumber"
          type="text"
          inputMode="numeric"
          maxLength={8}
          value={documentNumber}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '')
            setDocumentNumber(val)
          }}
          placeholder="12345678"
          className={inputClassName}
        />
      </div>

      <div>
        <label htmlFor="birthDate" className={labelClassName}>
          Fecha de nacimiento
        </label>
        <input
          id="birthDate"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className={inputClassName}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !isValidDni}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-ot-orange px-6 py-3 font-semibold text-white transition-colors hover:bg-ot-orange/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Guardando...
          </>
        ) : (
          'Confirmar y continuar'
        )}
      </button>
    </form>
  )
}
