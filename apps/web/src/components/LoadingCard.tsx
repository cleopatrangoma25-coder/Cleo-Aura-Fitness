import { Card } from '@repo/ui/Card'

type LoadingCardProps = {
  lines?: number
  ariaLabel?: string
}

export function LoadingCard({ lines = 3, ariaLabel }: LoadingCardProps) {
  return (
    <Card aria-label={ariaLabel} className="p-5 space-y-3" role={ariaLabel ? 'status' : undefined}>
      <div className="h-4 w-1/3 rounded shimmer-skeleton" />
      {Array.from({ length: lines }).map((_, index) => (
        <div
          className="h-3 w-full rounded shimmer-skeleton"
          key={index}
          style={{ animationDelay: `${index * 0.15}s` }}
        />
      ))}
    </Card>
  )
}
