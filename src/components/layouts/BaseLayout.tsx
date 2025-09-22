import React from 'react';
import AppSidebar from '../atoms/AppSidebar.tsx';
import Header from '../organisms/Header.tsx';
import { SidebarProvider } from "@/components/molecules/Sidebar.tsx";
export const BaseLayout: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  return <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-animation font-work-sans">
        <AppSidebar />
        <div className="flex-1 flex flex-col ml-[64px]"> {/* Fixed overlapping by using ml-[64px] instead of pl-[64px] */}
          <Header />
          <main className="flex-1 overflow-auto">
            <div className="relative z-10 p-4 sm:p-6 bg-black">
              {children}
            </div>
          </main>
        </div>

        {/* Ambient background effects - changed to orange tones */}
        <div className="fixed top-[10%] right-[15%] -z-10 w-96 h-96 bg-[#FF5F1F]/10 rounded-full blur-[120px] animate-pulse-soft" />
        <div className="fixed top-[60%] left-[5%] -z-10 w-80 h-80 bg-[#FF5F1F]/5 rounded-full blur-[120px] animate-pulse-soft" style={{
        animationDelay: '1.5s'
      }} />
        <div className="fixed bottom-[10%] right-[25%] -z-10 w-72 h-72 bg-[#FDA136]/5 rounded-full blur-[100px] animate-pulse-soft" style={{
        animationDelay: '2.3s'
      }} />
      </div>
    </SidebarProvider>;
};
export default BaseLayout;
