import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[url('/bg-grid.svg')] bg-fixed opacity-[0.01] pointer-events-none" />

      {/* Subtle Glow Effects - matching dashboard */}
      <div className="fixed top-[20%] right-[25%] -z-10 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px] animate-pulse-soft" />
      <div className="fixed top-[60%] left-[15%] -z-10 w-96 h-96 bg-orange-500/3 rounded-full blur-[120px] animate-pulse-soft" />

      {/* Auth Card Container */}
      <div className="w-full max-w-md relative z-10">
        {/* ATMO Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="relative">
              <img
                src="/atmo-logo.png"
                alt="ATMO Logo"
                className="w-24 h-24 object-contain drop-shadow-[0_0_20px_rgba(255,127,80,0.3)]"
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 font-['Work_Sans']">
            {title}
          </h1>
          {subtitle && (
            <p className="text-white/60 text-sm font-['Work_Sans']">
              {subtitle}
            </p>
          )}
        </div>

        {/* Auth Card with Cosmic Design */}
        <div className="relative">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-orange-500/10 rounded-2xl blur-xl" />

          {/* Main Card */}
          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/40 text-xs font-['Work_Sans']">
            © 2025 ATMO. Your AI-powered digital brain.
          </p>
        </div>
      </div>

      {/* CSS for twinkle animation */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }

        @keyframes pulse-soft {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }

        .animate-pulse-soft {
          animation: pulse-soft 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
