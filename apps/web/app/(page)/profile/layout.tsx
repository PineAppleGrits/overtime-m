import { ProfileNav } from '../../../modules/auth/components/ProfileNav';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ot-container py-8 md:py-12">
      <h1 className="mb-6 text-2xl font-bold text-white md:mb-8 md:text-3xl">Mi perfil</h1>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <ProfileNav />

        <section className="min-w-0 flex-1">
          {children}
        </section>
      </div>
    </div>
  );
}
