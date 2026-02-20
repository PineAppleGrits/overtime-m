"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  canRegister: boolean;
  tournamentId: string;
  tournamentSlug: string;
  categoryId: string;
  categorySlug: string;
  isRegistrationOpen: boolean;
  spotsLeft: number | null;
  hasMyRegistration: boolean;
};

export function CategoryRegistrationBlock({
  canRegister,
  tournamentSlug,
  categorySlug,
  isRegistrationOpen,
  spotsLeft,
  hasMyRegistration,
}: Props) {
  if (hasMyRegistration) return null;

  if (!isRegistrationOpen) {
    return (
      <p className="text-white/70">
        Las inscripciones están cerradas para esta categoría.
      </p>
    );
  }

  if (spotsLeft !== null && spotsLeft <= 0) {
    return (
      <p className="text-white/70">
        No quedan cupos disponibles para esta categoría.
      </p>
    );
  }

  if (!canRegister) return null;

  return (
    <div>
      <Button
        asChild
        className={cn(
          "bg-ot-orange! hover:bg-ot-orange/90! text-white! border-0!",
          "h-12 px-8 text-base font-semibold rounded-lg"
        )}
      >
        <Link
          href={`/torneos/${tournamentSlug}/${categorySlug}/inscribirse`}
          className="inline-flex items-center justify-center"
        >
          Inscribirse
        </Link>
      </Button>
      <p className="mt-2 text-sm text-white/60">
        Serás redirigido a elegir tu equipo y completar la inscripción.
      </p>
    </div>
  );
}
