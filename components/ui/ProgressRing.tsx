'use client'

interface ProgressRingProps {
  percent: number
  size?: number
  strokeWidth?: number
}

export default function ProgressRing({ percent, size = 52, strokeWidth = 4 }: ProgressRingProps) {
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference
  const cx = size / 2
  const cy = size / 2

  const getColor = () => {
    if (percent >= 100) return '#10b981'
    if (percent >= 75) return '#22d3ee'
    if (percent >= 50) return '#f59e0b'
    return '#6b7280'
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring-circle"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white" style={{ fontSize: size < 50 ? 10 : 12 }}>
          {percent}%
        </span>
      </div>
    </div>
  )
}
