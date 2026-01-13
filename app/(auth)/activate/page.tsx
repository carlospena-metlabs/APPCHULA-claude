import { ActivateForm } from '@/components/auth/activate-form'

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-900">Enlace inválido</h1>
          <p className="text-slate-600 mt-2">
            El enlace de activación no es válido.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Activa tu cuenta</h1>
          <p className="text-slate-600 mt-2">Establece tu contraseña</p>
        </div>
        <ActivateForm token={token} />
      </div>
    </div>
  )
}
