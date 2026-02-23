import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export default function ProfileTournamentsPage() {
  return (
    <Card className="border-ot-light-blue/50 bg-ot-dark-blue/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-white">
          <Trophy className="h-5 w-5 text-ot-orange" />
          Mis torneos
        </CardTitle>
        <CardDescription className="text-white/60">
          Torneos en los que participás o participaste.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Trophy className="h-10 w-10 text-white/20" aria-hidden="true" />
          <p className="mt-4 text-sm text-white/50">
            Todavía no participás en ningún torneo.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
