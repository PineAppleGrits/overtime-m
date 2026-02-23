import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function TeamsLoading() {
  return (
    <Card className="border-ot-light-blue/50 bg-ot-dark-blue/30">
      <CardHeader>
        <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-72 animate-pulse rounded bg-white/5" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-4">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-20 animate-pulse rounded bg-white/5" />
            </div>
            <div className="h-8 w-24 animate-pulse rounded-md bg-white/5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
