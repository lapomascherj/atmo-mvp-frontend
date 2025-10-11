import * as React from "react"

import { cn } from "@/utils/utils.ts"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  containerClassName?: string;
  labelClassName?: string;
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, containerClassName, labelClassName, ...props }, ref) => {
    const textarea = (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )

    if (!label && !helperText && !containerClassName) {
      return textarea
    }

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <label className={cn('text-xs text-white/40 uppercase tracking-wide', labelClassName)}>
            {label}
          </label>
        )}
        {textarea}
        {helperText && <p className="text-xs text-white/40">{helperText}</p>}
      </div>
    )
  }
)
TextArea.displayName = "TextArea"

export { TextArea }
