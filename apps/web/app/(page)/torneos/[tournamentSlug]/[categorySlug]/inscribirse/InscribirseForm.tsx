"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import TeamService from "@/modules/team/TeamService";
import RegistrationService from "@/modules/registration/RegistrationService";

type Props = {
  tournamentId: string;
  categoryId: string;
  categorySlug: string;
  tournamentSlug: string;
};

type Team = { id: string; name: string };

export function InscribirseForm({
  tournamentId,
  categoryId,
  categorySlug,
  tournamentSlug,
}: Props) {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await TeamService.getTeams({ limit: 100 });
        const data = res?.data ?? [];
        if (!cancelled) setTeams(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError("No se pudieron cargar los equipos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) return;
    setSubmitting(true);
    setError(null);
    try {
      await RegistrationService.createRegistration({
        teamId: selectedTeamId,
        tournamentId,
        categoryId,
      });
      router.push(`/torneos/${tournamentSlug}/${categorySlug}?inscrito=1`);
      router.refresh();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : null;
      setError(
        message || "No se pudo completar la inscripción. Intente de nuevo."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <p className="text-white/70" aria-live="polite">
        Cargando equipos...
      </p>
    );
  }

  if (teams.length === 0) {
    return (
      <p className="text-white/70">
        No hay equipos disponibles para inscribir. Cree un equipo primero.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div>
        <label
          htmlFor="team"
          className="block text-sm font-medium text-white mb-2"
        >
          Seleccione su equipo
        </label>
        <select
          id="team"
          name="team"
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
          required
          disabled={submitting}
          className={cn(
            "w-full rounded-lg border border-white/20 bg-ot-dark-blue/50 px-4 py-3 text-white",
            "focus:outline-none focus:ring-2 focus:ring-ot-orange focus:border-transparent",
            "disabled:opacity-50"
          )}
          aria-describedby={error ? "error-message" : undefined}
        >
          <option value="">Elegir equipo...</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p id="error-message" className="text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={!selectedTeamId || submitting}
          className={cn(
            "bg-ot-orange! hover:bg-ot-orange/90! text-white! border-0!",
            "h-11 px-6 font-semibold rounded-lg"
          )}
        >
          {submitting ? "Enviando..." : "Enviar inscripción"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          className={cn(
            "border-white/30! bg-transparent! text-white! hover:bg-white/10!",
            "h-11 px-6 rounded-lg"
          )}
          onClick={() => router.push(`/torneos/${tournamentSlug}/${categorySlug}`)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
