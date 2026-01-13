import { getClosureHistory } from '@/lib/actions/rendimientos'
import { MonthlyCloseClient } from '@/components/backoffice/monthly-close-client'

export default async function CierreMensualPage() {
  const closures = await getClosureHistory()

  return <MonthlyCloseClient initialClosures={closures} />
}
