
import React from 'react';
import { Card } from '@/components/atoms/Card.tsx';
import { cn } from '@/utils/utils.ts';

export interface AtmoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'orange' | 'purple' | 'gold';
  hover?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

export const AtmoCard = React.forwardRef<
  HTMLDivElement,
  AtmoCardProps
>(({
  variant = 'default',
  hover = true,
  glow = false,
  className,
  children,
  ...props
}, ref) => {
  return (
    <Card
      ref={ref}
      className={cn(
        'glass-card border-0 overflow-hidden relative bg-black/60 backdrop-blur-xl',
        hover && 'card-hover',
        variant === 'orange' && 'glass-card-orange',
        variant === 'purple' && 'glass-card-purple',
        variant === 'gold' && 'glass-card-gold',
        glow && variant === 'orange' && 'steady-orange-glow',
        glow && variant === 'purple' && 'animate-purple-glow',
        glow && variant === 'gold' && 'animate-gold-glow',
        className
      )}
      {...props}
    >
      {/* Add subtle gradient overlay */}
      <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-transparent via-white/5 to-transparent pointer-events-none" />

      {/* Light border at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-white/0 via-white/20 to-white/0" />

      {children}
    </Card>
  );
});

AtmoCard.displayName = 'AtmoCard';

export default AtmoCard;
