import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default async function ProfileTeamsPage() {
  return (
    <Card className="border-ot-light-blue/50 bg-ot-dark-blue/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-white">
          <Users className="h-5 w-5 text-ot-orange" />
          Mis equipos
        </CardTitle>
        <CardDescription className="text-white/60">
          Equipos en los que participás. Podés abandonar un equipo en cualquier momento.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-10 w-10 text-white/20" aria-hidden="true" />
          <p className="mt-4 text-sm text-white/50">
            No estás en ningún equipo actualmente.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
