'use client'

import { useCallback, useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'

type ExtractedData = {
  firstName: string
  lastName: string
  documentNumber: string
  birthDate: string
}

export function DniUploadStep({
  onComplete,
}: {
  onComplete: (data: ExtractedData) => void
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    setPreview(url)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleProcess = () => {
    setProcessing(true)
    // TODO: conectar con API de OCR para procesamiento de DNI
    setTimeout(() => {
      setProcessing(false)
      onComplete({
        firstName: '',
        lastName: '',
        documentNumber: '',
        birthDate: '',
      })
    }, 1500)
  }

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ot-light-blue/50 bg-ot-dark-blue/20 px-6 py-12 text-center transition-colors hover:border-ot-orange/40 hover:bg-ot-dark-blue/30"
      >
        {preview ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Vista previa del DNI"
              className="mx-auto max-h-48 rounded-lg object-contain"
            />
            <p className="text-sm text-ot-orange">Cambiar imagen</p>
          </div>
        ) : (
          <>
            <Upload className="mb-3 size-10 text-white/30" />
            <p className="text-sm font-semibold text-white/70">
              Arrastrá o hacé clic para subir el frente de tu DNI
            </p>
            <p className="mt-1 text-xs text-white/30">
              JPG, PNG — máximo 10 MB
            </p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
        aria-label="Seleccionar imagen del DNI"
      />

      {/* Process button */}
      <button
        onClick={handleProcess}
        disabled={!preview || processing}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-ot-orange px-6 py-3 font-semibold text-white transition-colors hover:bg-ot-orange/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {processing ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Procesando tu DNI...
          </>
        ) : (
          'Procesar DNI'
        )}
      </button>
    </div>
  )
}
