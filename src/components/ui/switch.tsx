"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/utils/utils"

interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  size?: "sm" | "default"
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className, size = "default", ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    data-slot="switch"
    data-size={size}
    className={cn(
      "peer group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent outline-none",
      "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[size=default]:h-[22px] data-[size=default]:w-[40px]",
      "data-[size=sm]:h-[16px] data-[size=sm]:w-[28px]",
      "transition-[background-color,box-shadow] duration-[250ms] ease-[cubic-bezier(0.25,1,0.5,1)]",
      "data-[state=unchecked]:bg-input data-[state=unchecked]:shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]",
      "data-[state=checked]:bg-primary data-[state=checked]:shadow-[inset_0_1px_2px_rgba(0,0,0,0.1),0_0_10px_color-mix(in_srgb,var(--primary)_25%,transparent)]",
      "dark:data-[state=unchecked]:bg-input/80",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      data-slot="switch-thumb"
      className={cn(
        "pointer-events-none block rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.06)]",
        "bg-white dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground",
        "group-data-[size=default]/switch:size-[18px]",
        "group-data-[size=sm]/switch:size-[12px]",
        "transition-[transform] duration-[250ms] ease-[cubic-bezier(0.25,1,0.5,1)]",
        "data-[state=unchecked]:translate-x-[2px]",
        "group-data-[size=default]/switch:data-[state=checked]:translate-x-[20px]",
        "group-data-[size=sm]/switch:data-[state=checked]:translate-x-[14px]",
      )}
    />
  </SwitchPrimitive.Root>
))
Switch.displayName = SwitchPrimitive.Root.displayName

export { Switch }
