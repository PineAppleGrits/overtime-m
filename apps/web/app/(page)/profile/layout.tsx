import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';
import { ProfileNav } from './ProfileNav';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ot-container py-8 md:py-12">
      <h1 className="mb-6 text-2xl font-bold text-white md:mb-8 md:text-3xl">Mi perfil</h1>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <ProfileNav />

        <section className="min-w-0 flex-1">
          <Suspense
            fallback={
              <div className="flex min-h-[30vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white/50" />
              </div>
            }
          >
            {children}
          </Suspense>
        </section>
      </div>
    </div>
  );
}
