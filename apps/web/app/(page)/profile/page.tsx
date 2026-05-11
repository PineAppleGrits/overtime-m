'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { checkPlayerAction } from '@/modules/admin/actions/blacklistActions';
import {
  IdCard,
  Mail,
  CheckCircle2,
  Info,
  ShieldCheck,
  ShieldBan,
  AlertTriangle,
} from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

type BlacklistStatus = {
  checked: boolean;
  isBlacklisted: boolean;
  reason: string | null;
};

export default function ProfileInfoPage() {
  const { profile } = useAuth();
  const [blacklistStatus, setBlacklistStatus] = useState<BlacklistStatus>({
    checked: false,
    isBlacklisted: false,
    reason: null,
  });
  const [checkingBlacklist, setCheckingBlacklist] = useState(false);

  const dniIsSet = !!profile?.documentNumber;

  const checkBlacklist = useCallback(async (dni: string) => {
    setCheckingBlacklist(true);
    try {
      const result = await checkPlayerAction(dni);
      if (result.success && result.data) {
        setBlacklistStatus({
          checked: true,
          isBlacklisted: result.data.isBlacklisted,
          reason: result.data.reason,
        });
      } else {
        setBlacklistStatus({ checked: true, isBlacklisted: false, reason: null });
      }
    } catch {
      setBlacklistStatus({ checked: true, isBlacklisted: false, reason: null });
    } finally {
      setCheckingBlacklist(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.documentNumber) {
      checkBlacklist(profile.documentNumber);
    }
  }, [profile?.documentNumber, checkBlacklist]);

  return (
    <div className="space-y-6">
      {/* Datos personales */}
      <Card className="border-ot-light-blue/50 bg-ot-dark-blue/30">
        <CardHeader className="flex flex-row items-center gap-4">
          {profile?.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.name}
              width={64}
              height={64}
              className="size-16 rounded-full"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-ot-orange text-2xl font-bold text-white">
              {profile?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <CardTitle className="text-xl text-white">{profile?.name}</CardTitle>
            <CardDescription className="text-white/60">{profile?.email}</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem
              icon={<Mail className="size-4 text-ot-orange" />}
              label="Email"
              value={profile?.email ?? '-'}
            />
            <InfoItem
              icon={<IdCard className="size-4 text-ot-orange" />}
              label="DNI"
              value={profile?.documentNumber ?? 'Sin completar'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Estado del jugador */}
      {dniIsSet && (
        <Card className="border-ot-light-blue/50 bg-ot-dark-blue/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <ShieldCheck className="size-5 text-ot-orange" />
              Estado del jugador
            </CardTitle>
          </CardHeader>
          <CardContent>
            {checkingBlacklist ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-60" />
              </div>
            ) : blacklistStatus.checked && blacklistStatus.isBlacklisted ? (
              <div className="space-y-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-sm font-medium text-red-400">
                  <ShieldBan className="size-3.5" />
                  No habilitado
                </span>
                <div className="flex gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-400" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-red-300">
                      Tu cuenta se encuentra inhabilitada para participar en torneos.
                    </p>
                    {blacklistStatus.reason && (
                      <p className="text-sm text-white/70">
                        <span className="font-medium text-white/80">Motivo:</span>{' '}
                        {blacklistStatus.reason}
                      </p>
                    )}
                    <p className="text-sm text-white/60">
                      Si creés que se trata de un error, ponete en contacto con la plataforma para
                      resolver la situación.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-sm font-medium text-green-400">
                  <CheckCircle2 className="size-3.5" />
                  Habilitado
                </span>
                <span className="text-sm text-white/50">
                  Podés participar en torneos y equipos.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* DNI */}
      <Card className="border-ot-light-blue/50 bg-ot-dark-blue/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <IdCard className="size-5 text-ot-orange" />
            Documento Nacional de Identidad (DNI)
          </CardTitle>
          <CardDescription className="text-white/60">
            Tu DNI nos permite asociar tu cuenta con los torneos y equipos en los que
            participás dentro de la plataforma.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {dniIsSet ? (
            <div className="space-y-2">
              <Label className="text-white/90">DNI</Label>
              <div className="flex items-center gap-3">
                <Input
                  value={profile?.documentNumber ?? ''}
                  disabled
                  className="border-ot-light-blue bg-ot-dark-blue/50 text-white/60"
                  aria-label="Número de documento"
                />
                <CheckCircle2 className="size-5 shrink-0 text-green-500" aria-hidden="true" />
              </div>
              <p className="text-xs text-white/50">
                Para modificar este valor, contactá a un administrador.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-3 rounded-lg border border-ot-orange/30 bg-ot-orange/10 p-3">
                <Info className="mt-0.5 size-4 shrink-0 text-ot-orange" />
                <p className="text-sm text-white/80">
                  Verificá tu DNI subiendo una foto. Una vez verificado, no vas a
                  poder modificarlo. Si necesitás cambiarlo, vas a tener que
                  contactar a un administrador.
                </p>
              </div>

              <Button
                asChild
                className="bg-ot-orange text-white hover:bg-ot-orange/90"
              >
                <Link href="/onboarding">Verificar DNI</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-ot-background/50 px-4 py-3">
      {icon}
      <div>
        <p className="text-xs text-white/50">{label}</p>
        <p className="text-sm font-medium text-white">{value}</p>
      </div>
    </div>
  );
}
