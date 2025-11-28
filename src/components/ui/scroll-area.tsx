import * as React from "react"
import { cn } from "../../lib/utils"

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function ScrollArea({
  className,
  children,
  ...props
}: ScrollAreaProps) {
  return (
    <div
      data-slot="scroll-area"
      className={cn("relative overflow-auto custom-scrollbar", className)}
      {...props}
    >
      <div
        data-slot="scroll-area-viewport"
        className="size-full"
      >
        {children}
      </div>
    </div>
  )
}

interface ScrollBarProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal";
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollBarProps) {
  // ScrollBar is handled by CSS custom-scrollbar class
  return null;
}

export { ScrollArea, ScrollBar }

