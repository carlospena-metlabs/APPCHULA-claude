import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  const hasCode = !!code

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold">A</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {hasCode ? 'Nueva contraseña' : 'Recuperar contraseña'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {hasCode
              ? 'Establece tu nueva contraseña'
              : 'Te enviaremos un email con instrucciones'}
          </p>
        </div>
        <ResetPasswordForm hasCode={hasCode} />
      </div>
    </div>
  )
}
