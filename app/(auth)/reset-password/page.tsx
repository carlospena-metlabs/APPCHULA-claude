import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams
  const hasCode = !!code

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            {hasCode ? 'Nueva contraseña' : 'Recuperar contraseña'}
          </h1>
          <p className="text-slate-600 mt-2">
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
