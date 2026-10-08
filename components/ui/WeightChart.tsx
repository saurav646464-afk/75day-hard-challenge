'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface WeightChartProps {
  data: { date: string; weight: number }[]
}

export default function WeightChart({ data }: WeightChartProps) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#71717a', fontSize: 10 }}
          tickFormatter={v => (v as string).slice(5)}
        />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fill: '#71717a', fontSize: 10 }}
        />
        <Tooltip
          contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
          labelStyle={{ color: '#f97316' }}
          formatter={(val) => [`${val ?? 0}kg`, 'Weight'] as [string, string]}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#f97316"
          strokeWidth={2}
          dot={{ fill: '#f97316', r: 4 }}
          activeDot={{ r: 6, fill: '#fb923c' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
