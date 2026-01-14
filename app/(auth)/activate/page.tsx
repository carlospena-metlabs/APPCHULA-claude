import { ActivateForm } from '@/components/auth/activate-form'

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">Enlace inválido</h1>
          <p className="text-muted-foreground mt-2">
            El enlace de activación no es válido.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold">A</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Activa tu cuenta</h1>
          <p className="text-muted-foreground mt-2">Establece tu contraseña</p>
        </div>
        <ActivateForm token={token} />
      </div>
    </div>
  )
}
