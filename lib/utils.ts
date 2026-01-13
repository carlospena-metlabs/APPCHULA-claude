import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export const GUARANTEED_PERCENTAGES = [2.5, 3.25, 4.25, 5.0] as const
export const WITHDRAWAL_WINDOWS = ['03-31', '06-30', '09-30', '12-31'] as const
export const MINIMUM_CAPITAL = 50000
export const WITHDRAWAL_ADVANCE_DAYS = 10
export const MINIMUM_MONTHS_FOR_WITHDRAWAL = 3

export function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month - 1)
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
  }).format(date)
}

export function calculateMonthsSince(startDate: string): number {
  const start = new Date(startDate)
  const now = new Date()
  return (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
}
