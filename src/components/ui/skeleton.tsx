import { cn } from "@/utils/utils"

import * as React from "react"

const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="skeleton"
    className={cn("rounded-md bg-black/10 dark:bg-muted animate-shimmer", className)}
    {...props}
  />
))
Skeleton.displayName = "Skeleton"

export { Skeleton }
