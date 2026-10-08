export function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton ${className || ''}`} />
}

export function TaskSkeleton() {
  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden p-4 space-y-3">
      {[1,2,3,4].map(i => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-7 h-7 rounded-full" />
          <Skeleton className="flex-1 h-5 rounded" />
        </div>
      ))}
    </div>
  )
}
