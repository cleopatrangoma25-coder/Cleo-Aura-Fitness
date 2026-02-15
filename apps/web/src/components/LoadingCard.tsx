import { Card } from '@repo/ui/Card'

export function LoadingCard({ lines = 3 }: { lines?: number }) {
  return (
    <Card className="p-5 animate-pulse space-y-3">
      <div className="h-4 w-1/3 rounded bg-slate-200" />
      {Array.from({ length: lines }).map((_, index) => (
        <div className="h-3 w-full rounded bg-slate-100" key={index} />
      ))}
    </Card>
  )
}
