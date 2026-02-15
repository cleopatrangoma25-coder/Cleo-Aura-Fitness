import * as React from 'react'
import { cn } from '../../lib/utils'

/**
 * Card Component (Shadcn UI Style)
 *
 * 🎭 ANALOGY: Think of the Card as a "display case" or "frame" for content.
 * Just like a picture frame makes artwork look polished, the Card component
 * wraps your content in a nice container with consistent styling.
 *
 * The Card has multiple parts (like a modular furniture set):
 * - Card: The main container (the frame itself)
 * - CardHeader: Top section (where you'd put a title)
 * - CardTitle: The main heading
 * - CardDescription: Subtitle or description
 * - CardContent: The main content area
 * - CardFooter: Bottom section (for actions/buttons)
 *
 * This is part of @repo/ui - the "shared component closet"!
 */

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-white/60 bg-white/85 text-card-foreground shadow-[0_26px_70px_-32px_rgba(31,35,54,0.35),0_10px_30px_-18px_rgba(231,111,138,0.18)] transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_30px_80px_-34px_rgba(31,35,54,0.4),0_12px_32px_-20px_rgba(31,191,159,0.18)] card-animate glass-card',
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
