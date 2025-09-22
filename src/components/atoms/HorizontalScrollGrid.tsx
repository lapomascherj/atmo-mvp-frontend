import React from 'react';

interface HorizontalScrollGridProps {
  children: React.ReactNode;
  emptyState?: React.ReactNode;
  className?: string;
}

const HorizontalScrollGrid: React.FC<HorizontalScrollGridProps> = ({
  children,
  emptyState,
  className = ""
}) => {
  const hasItems = React.Children.count(children) > 0;

  return (
    <div className={`h-full ${className}`}>
      {hasItems ? (
        <div className="h-full overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 min-w-full">
            {children}
          </div>
        </div>
      ) : (
        emptyState || (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400 text-sm">No items yet</p>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default HorizontalScrollGrid; 