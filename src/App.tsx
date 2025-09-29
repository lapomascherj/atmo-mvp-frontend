import {Toaster} from "@/components/molecules/Toaster.tsx";
import {Toaster as Sonner} from "@/components/organisms/Sonner.tsx";
import {TooltipProvider} from "@/components/atoms/Tooltip.tsx";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import React from "react";
import ErrorBoundary from "@/components/atoms/ErrorBoundary.tsx";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DailyRoad from "./pages/DailyRoad";
import Profile from "./pages/Profile";
import KnowledgeOrganiser from "./pages/KnowledgeOrganiser";
import ProjectView from "./pages/ProjectView";
import NewPage from "./pages/NewPage";
import DigitalBrain from "./pages/DigitalBrain";

// Components
import NavSidebar from "./components/molecules/NavSidebar.tsx";
import {DailyMapCtxProvider} from "@/context/DailyMapCtx.tsx";

const queryClient = new QueryClient();

// Simple layout component without authentication
const AppLayout: React.FC<{children: React.ReactNode}> = ({children}) => {
    return (
        <div className="flex h-screen overflow-hidden">
            <NavSidebar/>
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
            <Toaster/>
            <Sonner/>
        </div>
    );
};

// Main App Content with routing - no authentication required
const AppContent: React.FC = () => {
    return (
        <Routes>
            {/* Main App Routes - All accessible without authentication */}
            <Route path="/" element={
                <AppLayout>
                    <Index />
                </AppLayout>
            } />
            
            <Route path="/daily-road" element={
                <AppLayout>
                    <DailyRoad />
                </AppLayout>
            } />
            
            
            <Route path="/profile" element={
                <AppLayout>
                    <Profile />
                </AppLayout>
            } />
            
            <Route path="/knowledge-organiser" element={
                <AppLayout>
                    <KnowledgeOrganiser />
                </AppLayout>
            } />
            
            <Route path="/new-page" element={
                <AppLayout>
                    <NewPage />
                </AppLayout>
            } />
            
            <Route path="/knowledge-organiser/project/:id" element={
                <AppLayout>
                    <ProjectView />
                </AppLayout>
            } />
            
            <Route path="/digital-brain" element={
                <AppLayout>
                    <DigitalBrain />
                </AppLayout>
            } />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

function App() {
    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <TooltipProvider>
                    <BrowserRouter>
                        <DailyMapCtxProvider>
                            <AppContent />
                        </DailyMapCtxProvider>
                    </BrowserRouter>
                </TooltipProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

export default App;