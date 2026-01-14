'use client'

import { BalanceHistoryPoint } from '@/lib/actions/dashboard'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface BalanceChartProps {
  data: BalanceHistoryPoint[]
}

export function BalanceChart({ data }: BalanceChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolucion del Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No hay datos de rendimientos aun
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Invested</p>
          <CardTitle className="text-3xl font-bold text-foreground">
            {formatCurrency(data[data.length - 1]?.balance || 0)}
            <span className="ml-2 text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded">
              USDT
            </span>
          </CardTitle>
        </div>
        <div className="flex gap-2">
          {['YTD', '1d', '30d', '6m', '12m'].map((period) => (
            <button
              key={period}
              className="px-3 py-1 text-xs font-medium rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {period}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.70 0.15 175)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="oklch(0.70 0.15 175)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.70 0.15 175 / 10%)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: 'oklch(0.65 0 0)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12, fill: 'oklch(0.65 0 0)' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border border-primary/20 bg-card p-3 shadow-lg">
                        <p className="text-xs text-primary font-medium mb-1">{label}</p>
                        <p className="text-lg font-bold text-foreground">
                          {formatCurrency(payload[0].value as number)}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="oklch(0.70 0.15 175)"
                fill="url(#balanceGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
