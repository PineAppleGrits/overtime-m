import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ProfileInfoLoading() {
  return (
    <div className="space-y-6">
      {/* Datos personales skeleton */}
      <Card className="border-ot-light-blue/50 bg-ot-dark-blue/30">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-white/10" />
          <div className="space-y-2">
            <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-48 animate-pulse rounded bg-white/5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-16 animate-pulse rounded-lg bg-white/5" />
            <div className="h-16 animate-pulse rounded-lg bg-white/5" />
          </div>
        </CardContent>
      </Card>

      {/* Estado del jugador skeleton */}
      <Card className="border-ot-light-blue/50 bg-ot-dark-blue/30">
        <CardHeader>
          <div className="h-5 w-44 animate-pulse rounded bg-white/10" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-28 animate-pulse rounded-full bg-white/5" />
        </CardContent>
      </Card>

      {/* DNI skeleton */}
      <Card className="border-ot-light-blue/50 bg-ot-dark-blue/30">
        <CardHeader>
          <div className="h-5 w-64 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-full max-w-md animate-pulse rounded bg-white/5" />
        </CardHeader>
        <CardContent>
          <div className="h-10 w-full animate-pulse rounded-md bg-white/5" />
        </CardContent>
      </Card>
    </div>
  );
}
