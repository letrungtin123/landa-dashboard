import * as React from "react"

interface CollapsibleProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

function Collapsible({ open, onOpenChange, children, className, ...props }: CollapsibleProps) {
  return (
    <div data-slot="collapsible" data-state={open ? "open" : "closed"} className={className} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { _open: open, _onOpenChange: onOpenChange })
        }
        return child
      })}
    </div>
  )
}

interface CollapsibleTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  className?: string
  _open?: boolean
  _onOpenChange?: (open: boolean) => void
}

function CollapsibleTrigger({ children, asChild, _open, _onOpenChange, ...props }: CollapsibleTriggerProps) {
  const handleClick = () => {
    _onOpenChange?.(!_open)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        handleClick();
        (children as React.ReactElement<any>).props.onClick?.(e)
      },
      "data-state": _open ? "open" : "closed",
      ...props,
    })
  }

  return (
    <button
      type="button"
      data-slot="collapsible-trigger"
      data-state={_open ? "open" : "closed"}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  )
}

interface CollapsibleContentProps {
  children: React.ReactNode
  className?: string
  _open?: boolean
  _onOpenChange?: (open: boolean) => void
}

function CollapsibleContent({ children, className, _open, _onOpenChange, ...props }: CollapsibleContentProps) {
  if (!_open) return null

  return (
    <div data-slot="collapsible-content" data-state={_open ? "open" : "closed"} className={className} {...props}>
      {children}
    </div>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
