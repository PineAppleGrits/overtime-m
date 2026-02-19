export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 shadow-lg text-center">
        <h1 className="text-2xl font-bold text-red-600">
          Error de Autenticación
        </h1>
        <p className="text-gray-600">
          Hubo un problema al iniciar sesión. Por favor, intenta nuevamente.
        </p>
        <a
          href="/auth/login"
          className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Volver al login
        </a>
      </div>
    </div>
  );
}

