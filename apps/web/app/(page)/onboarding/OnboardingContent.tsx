'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DniUploadStep } from './DniUploadStep'
import { DniConfirmStep } from './DniConfirmStep'

type ExtractedData = {
  firstName: string
  lastName: string
  documentNumber: string
  birthDate: string
}

export function OnboardingContent({ profileName }: { profileName: string }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    firstName: '',
    lastName: '',
    documentNumber: '',
    birthDate: '',
  })
  const router = useRouter()

  const handleDniProcessed = (data: ExtractedData) => {
    setExtractedData(data)
    setStep(2)
  }

  return (
    <div className="min-h-screen bg-ot-background text-white">
      <div className="mx-auto max-w-lg px-4 py-12 md:py-20">
        {/* Stepper */}
        <div className="mb-10 flex items-center justify-center gap-0">
          <div
            className={`flex size-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
              step >= 1
                ? 'bg-ot-orange text-white'
                : 'bg-white/10 text-white/40'
            }`}
          >
            1
          </div>
          <div
            className={`mx-2 h-0.5 w-16 transition-colors ${
              step >= 2 ? 'bg-ot-orange' : 'bg-white/10'
            }`}
          />
          <div
            className={`flex size-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
              step >= 2
                ? 'bg-ot-orange text-white'
                : 'bg-white/10 text-white/40'
            }`}
          >
            2
          </div>
        </div>

        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="font-din-display text-2xl font-semibold tracking-tight md:text-3xl">
            {step === 1 ? 'Verificá tu identidad' : 'Confirmá tus datos'}
          </h1>
          <p className="mt-2 text-sm text-white/50">
            {step === 1
              ? `Hola ${profileName || 'jugador'}, subí una foto de tu DNI para completar tu perfil.`
              : 'Revisá que los datos sean correctos antes de continuar.'}
          </p>
        </div>

        {/* Steps */}
        {step === 1 ? (
          <DniUploadStep onComplete={handleDniProcessed} />
        ) : (
          <DniConfirmStep initialData={extractedData} />
        )}

        {/* Skip link */}
        <div className="mt-10 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-white/40 underline underline-offset-4 hover:text-white/60 transition-colors"
          >
            Verificar más tarde
          </button>
          <p className="mt-1.5 text-xs text-white/25">
            Podés completar esto más tarde desde tu perfil
          </p>
        </div>
      </div>
    </div>
  )
}
