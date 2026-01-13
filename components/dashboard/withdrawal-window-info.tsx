import { WithdrawalWindowInfo } from '@/lib/actions/retiros'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Clock, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface WithdrawalWindowInfoProps {
  windowInfo: WithdrawalWindowInfo
}

export function WithdrawalWindowInfoCard({ windowInfo }: WithdrawalWindowInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Ventana de Retiros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Proxima ventana:</span>
          <span className="font-medium">{windowInfo.windowFormatted}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Estado:</span>
          {windowInfo.isOpen ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              Abierta
            </Badge>
          ) : (
            <Badge variant="secondary">Cerrada</Badge>
          )}
        </div>

        {windowInfo.isOpen ? (
          <Alert className="border-green-200 bg-green-50">
            <Clock className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              La ventana esta abierta. Tienes {windowInfo.daysRemaining} dias para solicitar tu retiro.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              La ventana se abrira en {windowInfo.daysRemaining} dias (10 dias antes de la fecha de retiro).
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
