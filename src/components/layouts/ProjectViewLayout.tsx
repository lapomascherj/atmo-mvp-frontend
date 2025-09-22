import React from 'react';

interface ProjectViewLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export const ProjectViewLayout: React.FC<ProjectViewLayoutProps> = ({ 
  children, 
  sidebar 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[url('/bg-grid.svg')] bg-fixed opacity-[0.01] pointer-events-none" />
      <div className="fixed top-[20%] right-[25%] -z-10 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px] animate-pulse-soft" />

      {/* Centered container with max width */}
      <div className="mx-auto max-w-[1920px] min-h-screen">
        <div className="flex min-h-screen">
          {/* Main Content */}
          <div className="flex-1 px-4 md:px-8 py-12 ml-[70px] max-w-none">
            {children}
          </div>

          {/* Right Sidebar */}
          {sidebar && (
            <div className="w-80 lg:w-96 flex-shrink-0 py-12 pr-4 md:pr-8">
              {sidebar}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectViewLayout; 