import { Footer } from '@/modules/common/components/Footer';
import { Header } from '@/modules/common/components/Header';
import Image from 'next/image';
import Link from 'next/link';

/**
 * Página 404 global: se usa para cualquier URL que no coincida con una ruta.
 * Debe estar en la raíz de app/ para que Next.js la use en rutas como /galeria.
 * Si solo existe app/(page)/not-found.tsx, las rutas no definidas pueden no usarla
 * correctamente y provocar bucles de peticiones.
 */
export default function NotFound() {
  return (
    <main className="grid grid-rows-[auto_1fr_auto] min-h-screen">
      <Header />
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-white">
        <h2 className="text-2xl font-semibold text-ot-orange">Página no encontrada</h2>
        <p className="text-gray-400">
          No existe la ruta que estás buscando.
        </p>
        <Image src="/jordanAI.png" alt="Página no encontrada" width={300} height={300} />
        <Link
          href="/"
          className="rounded-lg bg-ot-orange px-4 py-2 text-white hover:opacity-90"
        >
          Volver al inicio
        </Link>
      </div>
      <Footer />
    </main>

  );
}
