import React from 'react';
import { Menu } from 'lucide-react';
import NotificationSidebar from '../molecules/NotificationSidebar.tsx';
import { useSidebar } from "@/components/molecules/Sidebar.tsx";

const Header: React.FC = () => {
  // Add a safe check to handle cases where SidebarProvider might not be available
  let sidebarActions = { toggleSidebar: () => {} };

  try {
    sidebarActions = useSidebar();
  } catch (error) {
    console.warn("SidebarProvider not found, using fallback for toggleSidebar");
  }

  const { toggleSidebar } = sidebarActions;

  return (
    <header className="w-full backdrop-blur-xl bg-black/40 border-b border-white/5 flex items-center justify-between p-4 sm:p-6 shadow-lg z-20">
      <button
        onClick={toggleSidebar}
        className="p-2 hover:bg-white/10 rounded-full transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5 text-white/80" />
      </button>

      <div className="flex-1 flex justify-center">
        <h1 className="text-2xl font-bold tracking-wider text-[#FF5F1F] animate-pulse-soft">ATMO</h1>
      </div>

      <div>
        <NotificationSidebar />
      </div>
    </header>
  );
};

export default Header;
