import { getCurrentUser } from '@/lib/actions/auth'
import { getMonthlyYields } from '@/lib/actions/dashboard'
import { redirect } from 'next/navigation'
import { YieldsTable } from '@/components/dashboard/yields-table'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function RendimientosPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const yields = await getMonthlyYields(user.id)

  // Calculate summary stats
  const totalYields = yields.reduce((sum, y) => sum + y.yield_amount, 0)
  const avgPercentage = yields.length > 0
    ? yields.reduce((sum, y) => sum + y.percentage_applied, 0) / yields.length
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rendimientos</h1>
        <p className="mt-1 text-muted-foreground">
          Historial de rendimientos mensuales
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Generado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalYields)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Promedio Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(avgPercentage)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Meses con Rendimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {yields.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <YieldsTable yields={yields} />
    </div>
  )
}
