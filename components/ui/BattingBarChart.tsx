'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { DailyLog } from '@/types'
import { getDayNumber } from '@/lib/challenge'

interface BattingBarChartProps {
  logs: DailyLog[]
  startDate: string
}

export default function BattingBarChart({ logs, startDate }: BattingBarChartProps) {
  const data = logs
    .filter(l => l.batting_balls > 0)
    .sort((a, b) => a.log_date.localeCompare(b.log_date))
    .map(l => ({
      day: getDayNumber(startDate, l.log_date),
      balls: l.batting_balls,
    }))
    .slice(-20)

  if (data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="day"
          tick={{ fill: '#71717a', fontSize: 10 }}
          tickFormatter={v => `D${v}`}
        />
        <YAxis tick={{ fill: '#71717a', fontSize: 10 }} />
        <Tooltip
          contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
          labelStyle={{ color: '#f97316' }}
          formatter={(val) => [`${val ?? 0} balls`, 'Batting'] as [string, string]}
          labelFormatter={l => `Day ${l}`}
        />
        <ReferenceLine y={1000} stroke="#f97316" strokeDasharray="4 4" opacity={0.6} />
        <Bar
          dataKey="balls"
          fill="#f97316"
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
