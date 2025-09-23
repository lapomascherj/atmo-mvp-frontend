import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/utils/utils';

interface InteractiveDividerProps {
  /** Initial position as percentage (0-100) */
  initialPosition?: number;
  /** Minimum position as percentage */
  minPosition?: number;
  /** Maximum position as percentage */
  maxPosition?: number;
  /** Callback when position changes */
  onPositionChange?: (position: number) => void;
  /** Custom styling */
  className?: string;
  /** Whether the divider is disabled */
  disabled?: boolean;
  /** Whether to show on mobile devices */
  showOnMobile?: boolean;
}

const InteractiveDivider: React.FC<InteractiveDividerProps> = ({
  initialPosition = 50,
  minPosition = 20,
  maxPosition = 80,
  onPositionChange,
  className,
  disabled = false,
  showOnMobile = true
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const dividerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mouse/touch start
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    // Capture pointer for smooth dragging
    if (dividerRef.current) {
      dividerRef.current.setPointerCapture(e.pointerId);
    }
  }, [disabled]);

  // Handle mouse/touch move with enhanced viewport constraints
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging || !containerRef.current || disabled) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
    
    // Enhanced clamping: respect minPosition/maxPosition AND ensure visibility
    const safeMinPosition = Math.max(minPosition, 5); // 5% minimum from left edge
    const safeMaxPosition = Math.min(maxPosition, 95); // 5% minimum from right edge
    const clampedPosition = Math.max(safeMinPosition, Math.min(safeMaxPosition, newPosition));
    
    setPosition(clampedPosition);
    onPositionChange?.(clampedPosition);
  }, [isDragging, minPosition, maxPosition, onPositionChange, disabled]);

  // Handle mouse/touch end
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard navigation with enhanced viewport constraints
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;
    
    const step = e.shiftKey ? 10 : 2; // Larger steps with Shift
    let newPosition = position;
    
    // Safe boundaries for keyboard navigation
    const safeMinPosition = Math.max(minPosition, 5);
    const safeMaxPosition = Math.min(maxPosition, 95);
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newPosition = Math.max(safeMinPosition, position - step);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newPosition = Math.min(safeMaxPosition, position + step);
        break;
      case 'Home':
        e.preventDefault();
        newPosition = safeMinPosition;
        break;
      case 'End':
        e.preventDefault();
        newPosition = safeMaxPosition;
        break;
      case 'Space':
      case 'Enter':
        e.preventDefault();
        newPosition = (safeMinPosition + safeMaxPosition) / 2; // Reset to safe center
        break;
      default:
        return;
    }
    
    setPosition(newPosition);
    onPositionChange?.(newPosition);
  }, [position, minPosition, maxPosition, onPositionChange, disabled]);

  // Global pointer events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      
      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Reset position when initialPosition changes
  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  return (
    <div 
      ref={containerRef}
      className={cn(
        "absolute inset-0 pointer-events-none overflow-hidden",
        !showOnMobile && "hidden lg:block"
      )}
      style={{ zIndex: 10 }}
    >
      {/* Invisible interaction area - constrained within viewport */}
      <div
        className="absolute top-0 bottom-0 pointer-events-auto cursor-col-resize touch-none select-none"
        style={{
          left: `max(12px, min(calc(100% - 36px), calc(${position}% - 12px)))`,
          width: '24px',
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Visible divider line - thin by default */}
        <div
          ref={dividerRef}
          className={cn(
            'absolute top-0 bottom-0 left-1/2 -translate-x-1/2 transition-all duration-300 ease-out',
            'bg-gradient-to-b from-transparent to-transparent',
            // Thin line by default
            'w-px via-white/10',
            // Enhanced styling only when hovered or dragging
            (isHovering || isDragging) && 'w-1 via-[#FF7000]/40 shadow-lg shadow-white/20',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          style={{
            backgroundImage: isHovering || isDragging 
              ? 'linear-gradient(to bottom, transparent, rgba(255, 112, 0, 0.4), transparent)'
              : 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.1), transparent)'
          }}
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={Math.round(position)}
          aria-valuemin={minPosition}
          aria-valuemax={maxPosition}
          aria-label="Adjustable layout divider"
        >
          {/* Handle indicator - only visible on hover */}
          {(isHovering || isDragging) && (
            <div
              className={cn(
                'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                'w-6 h-12 rounded-full transition-all duration-300 ease-out',
                'bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-sm',
                'border border-white/20 shadow-lg',
                'flex items-center justify-center',
                'scale-110 border-[#FF7000]/40',
                disabled && 'opacity-50'
              )}
            >
              {/* Grip lines */}
              <div className="flex flex-col gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full bg-[#FF7000]/80 transition-colors duration-300 ease-out"
                  />
                ))}
              </div>

              {/* Glow effect when active */}
              <div className="absolute inset-0 bg-[#FF7000]/10 blur-sm rounded-full scale-150" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveDivider;
