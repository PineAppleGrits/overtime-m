'use client'

import { useState, useTransition, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ChevronLeft, ChevronRight, Check, Plus, Trash2,
  Trophy, Shield, AlertCircle, Upload, X, ImageIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createUserTeamAction } from '@/modules/profile/actions/teamActions'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type FlowType = 'franchise' | 'standalone'
interface Sport { id: string; name: string }
interface FranchiseData { name: string; logoFile: File | null }
interface TeamData { name: string; logoFile: File | null; sportId: string }
interface PlayerData {
  id: string
  firstName: string
  lastName: string
  documentNumber: string
  birthDate: string
}
interface WizardState {
  flowType: FlowType | null
  franchise: FranchiseData
  team: TeamData
  players: PlayerData[]
}

interface Props { sports: Sport[] }

// ─── Upload helper ────────────────────────────────────────────────────────────

async function uploadTeamLogo(teamId: string, file: File): Promise<string | null> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const formData = new FormData()
    formData.append('logo', file)

    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api'
    const res = await fetch(`${base}/teams/${teamId}/logo`, {
      method: 'POST',
      headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {},
      body: formData,
    })

    if (!res.ok) return null
    const data = await res.json()
    return data?.logoUrl ?? null
  } catch {
    return null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyPlayer(): PlayerData {
  return { id: crypto.randomUUID(), firstName: '', lastName: '', documentNumber: '', birthDate: '' }
}

function stateHasProgress(s: WizardState): boolean {
  return (
    s.flowType !== null ||
    s.team.name.trim() !== '' ||
    s.team.logoFile !== null ||
    s.franchise.name.trim() !== '' ||
    s.players.length > 0
  )
}

// ─── Base UI ──────────────────────────────────────────────────────────────────

function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, idx) => (
        <div key={idx} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all',
              idx < current  ? 'border-ot-orange bg-ot-orange text-white'
                : idx === current ? 'border-ot-orange bg-transparent text-ot-orange'
                : 'border-white/20 bg-transparent text-white/30',
            )}>
              {idx < current ? <Check className="h-4 w-4" /> : idx + 1}
            </div>
            <span className={cn(
              'hidden sm:block text-[10px] font-medium whitespace-nowrap',
              idx === current ? 'text-white' : 'text-white/30',
            )}>
              {label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={cn(
              'flex-1 h-px mx-2 mt-[-14px]',
              idx < current ? 'bg-ot-orange' : 'bg-white/15',
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-white/80 mb-1.5">
      {children}
      {required && <span className="ml-1 text-ot-orange">*</span>}
    </label>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text', className }: {
  value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; className?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full rounded-lg border border-ot-light-blue/40 bg-white/5 px-3 py-2',
        'text-sm text-white placeholder:text-white/30',
        'focus:outline-none focus:ring-2 focus:ring-ot-orange/50 focus:border-ot-orange/60 transition-colors',
        className,
      )}
    />
  )
}

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30 p-5', className)}>
      {children}
    </div>
  )
}

// ─── Logo Upload ──────────────────────────────────────────────────────────────

function LogoUpload({ file, onChange }: { file: File | null; onChange: (f: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const preview = file ? URL.createObjectURL(file) : null

  const handleFile = (f: File) => {
    if (!f.type.startsWith('image/')) {
      toast.error('Solo se aceptan imágenes')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('El archivo no puede superar 5 MB')
      return
    }
    onChange(f)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  if (preview && file) {
    return (
      <div className="relative w-24 h-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Logo preview" className="h-24 w-24 rounded-xl object-cover border border-ot-light-blue/40" />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#1a1730] border border-white/20 text-white/60 hover:text-white transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        'flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed py-6 transition-all',
        dragging
          ? 'border-ot-orange/60 bg-ot-orange/5'
          : 'border-ot-light-blue/30 hover:border-ot-orange/40 hover:bg-white/3',
      )}
    >
      <div className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
        dragging ? 'bg-ot-orange/20 text-ot-orange' : 'bg-white/8 text-white/30',
      )}>
        <Upload className="h-5 w-5" />
      </div>
      <div className="text-center">
        <p className="text-sm text-white/50">
          <span className="text-ot-orange/80 font-medium">Elegí un archivo</span> o arrastralo acá
        </p>
        <p className="text-xs text-white/25 mt-0.5">PNG, JPG, WEBP · máx. 5 MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </button>
  )
}

// ─── Step 0: Choose flow ──────────────────────────────────────────────────────

function ChooseFlowStep({ onSelect }: { onSelect: (t: FlowType) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">¿Cómo querés crear tu equipo?</h2>
        <p className="mt-1 text-sm text-white/50">Elegí el tipo de estructura que mejor se adapte a tu organización.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          onClick={() => onSelect('franchise')}
          className="group flex flex-col gap-3 rounded-xl border-2 border-ot-light-blue/40 bg-white/3 p-5 text-left transition-all hover:border-ot-orange/60 hover:bg-ot-orange/5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ot-orange/15 text-ot-orange">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-white">Franquicia</p>
            <p className="mt-1 text-xs text-white/50 leading-relaxed">
              Creá una franquicia que agrupe varios equipos. Ideal para clubes con múltiples categorías.
            </p>
          </div>
          <p className="text-xs font-medium text-ot-orange/70 group-hover:text-ot-orange transition-colors">
            Ej: Club Atlético → Sub-20, Sub-17, Libre
          </p>
        </button>

        <button
          onClick={() => onSelect('standalone')}
          className="group flex flex-col gap-3 rounded-xl border-2 border-ot-light-blue/40 bg-white/3 p-5 text-left transition-all hover:border-blue-500/60 hover:bg-blue-500/5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-white">Equipo independiente</p>
            <p className="mt-1 text-xs text-white/50 leading-relaxed">
              Un equipo sin estructura de franquicia. Perfecto para equipos que compiten solos.
            </p>
          </div>
          <p className="text-xs font-medium text-blue-400/70 group-hover:text-blue-400 transition-colors">
            Ej: Los Pumas FC
          </p>
        </button>
      </div>
    </div>
  )
}

// ─── Step: Franchise info ─────────────────────────────────────────────────────

function FranchiseStep({ data, onChange }: {
  data: FranchiseData
  onChange: (d: Partial<FranchiseData>) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Datos de la franquicia</h2>
        <p className="mt-1 text-sm text-white/50">La franquicia agrupa todos tus equipos bajo un mismo nombre.</p>
      </div>
      <SectionCard>
        <div className="space-y-4">
          <div>
            <FieldLabel required>Nombre de la franquicia</FieldLabel>
            <TextInput value={data.name} onChange={(v) => onChange({ name: v })} placeholder="Ej: Club Atlético Belgrano" />
          </div>
          <div>
            <FieldLabel>Logo de la franquicia</FieldLabel>
            <LogoUpload file={data.logoFile} onChange={(f) => onChange({ logoFile: f })} />
            <p className="mt-1.5 text-xs text-white/35">El logo puede ser compartido por todos sus equipos.</p>
          </div>
        </div>
      </SectionCard>
      <div className="flex items-start gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3">
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-400/70" />
        <p className="text-xs text-amber-400/70 leading-relaxed">
          La gestión de franquicias estará disponible pronto. Por ahora el equipo se creará de forma independiente con el nombre de la franquicia como referencia.
        </p>
      </div>
    </div>
  )
}

// ─── Step: Team info ──────────────────────────────────────────────────────────

function TeamStep({ data, franchiseName, sports, onChange }: {
  data: TeamData
  franchiseName?: string
  sports: Sport[]
  onChange: (d: Partial<TeamData>) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Datos del equipo</h2>
        {franchiseName && (
          <p className="mt-1 text-sm text-white/50">
            Pertenecerá a la franquicia <span className="text-white font-medium">{franchiseName}</span>.
          </p>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/4 p-3">
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-white/40" />
        <p className="text-xs text-white/50 leading-relaxed">
          La <span className="text-white/70 font-medium">categoría competitiva</span> es asignada por la organización luego de disputar partidos amistosos de evaluación. Una vez categorizado, podrás inscribirte en los torneos correspondientes.
        </p>
      </div>

      <SectionCard>
        <div className="space-y-4">
          <div>
            <FieldLabel required>Nombre del equipo</FieldLabel>
            <TextInput value={data.name} onChange={(v) => onChange({ name: v })} placeholder="Ej: Los Pumas" />
          </div>
          <div>
            <FieldLabel required>Disciplina</FieldLabel>
            <select
              value={data.sportId}
              onChange={(e) => onChange({ sportId: e.target.value })}
              className="w-full rounded-lg border border-ot-light-blue/40 bg-[#100f14] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-ot-orange/50 focus:border-ot-orange/60 transition-colors"
            >
              <option value="" disabled>Seleccionar disciplina</option>
              {sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Logo del equipo</FieldLabel>
            <LogoUpload file={data.logoFile} onChange={(f) => onChange({ logoFile: f })} />
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Step: Players ────────────────────────────────────────────────────────────

function PlayersStep({ players, onAdd, onRemove, onChange }: {
  players: PlayerData[]
  onAdd: () => void
  onRemove: (id: string) => void
  onChange: (id: string, field: keyof Omit<PlayerData, 'id'>, value: string) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Jugadores</h2>
        <p className="mt-1 text-sm text-white/50">Podés agregar más jugadores después de crear el equipo.</p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-blue-400/20 bg-blue-400/5 p-3">
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-blue-400/60" />
        <p className="text-xs text-blue-400/60 leading-relaxed">
          Si un jugador se registra en la plataforma y verifica su identidad con el DNI ingresado, el equipo aparecerá automáticamente en su perfil.
        </p>
      </div>

      <div className="space-y-3">
        {players.map((player, idx) => (
          <SectionCard key={player.id}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Jugador {idx + 1}</span>
              <button
                onClick={() => onRemove(player.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:bg-red-500/15 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>Nombre</FieldLabel>
                <TextInput value={player.firstName} onChange={(v) => onChange(player.id, 'firstName', v)} placeholder="Nombre" />
              </div>
              <div>
                <FieldLabel>Apellido</FieldLabel>
                <TextInput value={player.lastName} onChange={(v) => onChange(player.id, 'lastName', v)} placeholder="Apellido" />
              </div>
              <div>
                <FieldLabel>DNI</FieldLabel>
                <TextInput value={player.documentNumber} onChange={(v) => onChange(player.id, 'documentNumber', v)} placeholder="12345678" />
              </div>
              <div>
                <FieldLabel>Fecha de nacimiento</FieldLabel>
                <TextInput type="date" value={player.birthDate} onChange={(v) => onChange(player.id, 'birthDate', v)} />
              </div>
            </div>
          </SectionCard>
        ))}

        <button
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ot-light-blue/30 py-3 text-sm text-white/40 transition-all hover:border-ot-orange/40 hover:text-ot-orange/70"
        >
          <Plus className="h-4 w-4" />
          Agregar jugador
        </button>
      </div>

      {players.length === 0 && (
        <p className="text-center text-xs text-white/30">Podés crear el equipo sin jugadores y agregarlos después.</p>
      )}
    </div>
  )
}

// ─── Step: Review ─────────────────────────────────────────────────────────────

function ReviewStep({ state, sports, userName }: {
  state: WizardState
  sports: Sport[]
  userName: string
}) {
  const sport = sports.find((s) => s.id === state.team.sportId)
  const teamPreview = state.team.logoFile ? URL.createObjectURL(state.team.logoFile) : null
  const franchisePreview = state.franchise.logoFile ? URL.createObjectURL(state.franchise.logoFile) : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Revisar y confirmar</h2>
        <p className="mt-1 text-sm text-white/50">Revisá los datos antes de crear el equipo.</p>
      </div>

      {state.flowType === 'franchise' && (
        <SectionCard>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Franquicia</p>
          <div className="flex items-center gap-3">
            {franchisePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={franchisePreview} alt="" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ot-orange/15 text-ot-orange font-bold">
                {state.franchise.name.charAt(0).toUpperCase() || <ImageIcon className="h-4 w-4" />}
              </div>
            )}
            <p className="font-semibold text-white">{state.franchise.name}</p>
          </div>
        </SectionCard>
      )}

      <SectionCard>
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Equipo</p>
        <div className="flex items-center gap-3 mb-4">
          {teamPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={teamPreview} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 font-bold text-lg">
              {(state.team.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-white">{state.team.name}</p>
            <p className="text-xs text-white/40">{sport?.name ?? '—'}</p>
          </div>
        </div>
        <div className="border-t border-white/10 pt-3">
          <p className="text-xs text-white/40 mb-2">Delegados</p>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ot-orange/20 text-ot-orange text-xs font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-white">{userName}</span>
            <span className="rounded-full bg-ot-orange/20 px-2 py-0.5 text-[10px] font-semibold text-ot-orange">
              Delegado
            </span>
          </div>
        </div>
      </SectionCard>

      {state.players.length > 0 && (
        <SectionCard>
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
            Jugadores ({state.players.length})
          </p>
          <div className="space-y-2">
            {state.players.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{p.firstName} {p.lastName}</p>
                  {p.documentNumber && <p className="text-xs text-white/40">DNI {p.documentNumber}</p>}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-white/30 border-t border-white/8 pt-3">
            Si algún jugador se registra en la plataforma y verifica su identidad, el equipo aparecerá automáticamente en su perfil.
          </p>
        </SectionCard>
      )}

      {(state.team.logoFile || state.franchise.logoFile) && (
        <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/4 p-3">
          <Upload className="h-4 w-4 mt-0.5 shrink-0 text-white/40" />
          <p className="text-xs text-white/50 leading-relaxed">
            El logo se subirá automáticamente después de crear el equipo. El equipo queda creado aunque la subida falle.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export function CreateTeamWizard({ sports }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [state, setState] = useState<WizardState>({
    flowType: null,
    franchise: { name: '', logoFile: null },
    team: { name: '', logoFile: null, sportId: '' },
    players: [],
  })

  const isFranchise = state.flowType === 'franchise'
  const [rawStep, setRawStep] = useState(0)

  const stepLabels = isFranchise
    ? ['Tipo', 'Franquicia', 'Equipo', 'Jugadores', 'Confirmar']
    : ['Tipo', 'Equipo', 'Jugadores', 'Confirmar']

  const totalSteps = stepLabels.length
  const step = Math.min(rawStep, totalSteps - 1)

  // ── Warn before leaving if progress exists ─────────────────────────────────
  useEffect(() => {
    if (!stateHasProgress(state)) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [state])

  // ── Navigation ─────────────────────────────────────────────────────────────
  const canGoNext = () => {
    if (step === 0) return state.flowType !== null
    if (isFranchise) {
      if (step === 1) return state.franchise.name.trim().length > 0
      if (step === 2) return state.team.name.trim().length > 0 && state.team.sportId.length > 0
    } else {
      if (step === 1) return state.team.name.trim().length > 0 && state.team.sportId.length > 0
    }
    return true
  }

  const next = () => setRawStep((s) => Math.min(s + 1, totalSteps - 1))
  const back = () => setRawStep((s) => Math.max(s - 1, 0))

  const handleSelectFlow = (flowType: FlowType) => {
    setState((s) => ({ ...s, flowType }))
    setRawStep(1)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    startTransition(async () => {
      // 1. Create team
      const result = await createUserTeamAction({
        name: state.team.name,
        sportId: state.team.sportId,
      })

      if (!result.success) {
        toast.error('Falló la creación del equipo', {
          description: result.error ?? 'Ocurrió un error inesperado. Intentá de nuevo.',
        })
        return
      }

      const teamId = result.data?.id

      // 2. Upload logo asynchronously (non-blocking)
      if (teamId && state.team.logoFile) {
        uploadTeamLogo(teamId, state.team.logoFile).then((url) => {
          if (!url) toast.warning('El equipo fue creado pero el logo no pudo subirse. Podés intentarlo desde la configuración del equipo.')
        })
      }

      toast.success('¡Equipo creado!')
      router.push('/profile/equipos')
    })
  }

  // ── Render step ────────────────────────────────────────────────────────────
  const renderStep = () => {
    if (step === 0) return <ChooseFlowStep onSelect={handleSelectFlow} />

    if (isFranchise) {
      if (step === 1)
        return <FranchiseStep data={state.franchise} onChange={(d) => setState((s) => ({ ...s, franchise: { ...s.franchise, ...d } }))} />
      if (step === 2)
        return <TeamStep data={state.team} franchiseName={state.franchise.name} sports={sports} onChange={(d) => setState((s) => ({ ...s, team: { ...s.team, ...d } }))} />
      if (step === 3)
        return (
          <PlayersStep
            players={state.players}
            onAdd={() => setState((s) => ({ ...s, players: [...s.players, emptyPlayer()] }))}
            onRemove={(id) => setState((s) => ({ ...s, players: s.players.filter((p) => p.id !== id) }))}
            onChange={(id, field, value) => setState((s) => ({ ...s, players: s.players.map((p) => p.id === id ? { ...p, [field]: value } : p) }))}
          />
        )
      return <ReviewStep state={state} sports={sports} userName="Vos" />
    }

    if (step === 1)
      return <TeamStep data={state.team} sports={sports} onChange={(d) => setState((s) => ({ ...s, team: { ...s.team, ...d } }))} />
    if (step === 2)
      return (
        <PlayersStep
          players={state.players}
          onAdd={() => setState((s) => ({ ...s, players: [...s.players, emptyPlayer()] }))}
          onRemove={(id) => setState((s) => ({ ...s, players: s.players.filter((p) => p.id !== id) }))}
          onChange={(id, field, value) => setState((s) => ({ ...s, players: s.players.map((p) => p.id === id ? { ...p, [field]: value } : p) }))}
        />
      )
    return <ReviewStep state={state} sports={sports} userName="Vos" />
  }

  const isLastStep = step === totalSteps - 1

  return (
    <div className="max-w-xl">
      {state.flowType !== null && <StepIndicator steps={stepLabels} current={step} />}

      <div className="min-h-[360px]">{renderStep()}</div>

      {step > 0 && (
        <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
          <button
            onClick={back}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm text-white/50 hover:text-white transition-colors disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Atrás
          </button>

          {isLastStep ? (
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-ot-orange px-5 py-2 text-sm font-semibold text-white hover:bg-ot-orange/90 transition-colors disabled:opacity-50"
            >
              {isPending ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : <Check className="h-4 w-4" />}
              Crear equipo
            </button>
          ) : (
            <button
              onClick={next}
              disabled={!canGoNext()}
              className="flex items-center gap-1.5 rounded-lg bg-ot-orange px-5 py-2 text-sm font-semibold text-white hover:bg-ot-orange/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continuar
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
