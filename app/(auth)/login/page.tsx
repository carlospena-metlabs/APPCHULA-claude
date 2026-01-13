import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">APPCHULA</h1>
          <p className="text-slate-600 mt-2">Accede a tu cuenta</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
