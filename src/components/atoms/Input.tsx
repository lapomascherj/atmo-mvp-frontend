import * as React from "react"

import { cn } from "@/utils/utils.ts"

interface InputProps extends React.ComponentProps<"input"> {
  label?: string;
  helperText?: string;
  containerClassName?: string;
  labelClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type,
    label,
    helperText,
    containerClassName,
    labelClassName,
    ...props
  }, ref) => {
    const inputElement = (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )

    if (!label && !helperText && !containerClassName) {
      return inputElement
    }

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <label className={cn('text-xs text-white/40 uppercase tracking-wide', labelClassName)}>
            {label}
          </label>
        )}
        {inputElement}
        {helperText && <p className="text-xs text-white/40">{helperText}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
