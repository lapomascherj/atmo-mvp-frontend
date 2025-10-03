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
import Profile from "./pages/Profile";
import DigitalBrain from "./pages/DigitalBrain";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding";
import TestConnection from "./pages/TestConnection";

// Components
import NavSidebar from "./components/molecules/NavSidebar.tsx";
import {DailyMapCtxProvider} from "@/context/DailyMapCtx.tsx";
import {SidebarProvider, useSidebar} from "@/context/SidebarContext.tsx";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

// Simple layout component without authentication
const AppLayout: React.FC<{children: React.ReactNode}> = ({children}) => {
    const { sidebarWidth } = useSidebar();

    return (
        <div className="flex h-screen overflow-hidden">
            <NavSidebar/>
            <main className="flex-1 h-full overflow-hidden" style={{ marginLeft: sidebarWidth }}>
                {children}
            </main>
            <Toaster/>
            <Sonner/>
        </div>
    );
};

// Main App Content with routing
const AppContent: React.FC = () => {
    return (
        <Routes>
            {/* Test Route */}
            <Route path="/test-connection" element={<TestConnection />} />

            {/* Public Auth Routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />

            {/* Onboarding Route (Protected) */}
            <Route path="/onboarding" element={
                <ProtectedRoute>
                    <Onboarding />
                </ProtectedRoute>
            } />

            {/* App Routes - Temporarily without authentication */}
            <Route path="/" element={
                <AppLayout>
                    <Index />
                </AppLayout>
            } />

            <Route path="/dashboard" element={
                <AppLayout>
                    <Index />
                </AppLayout>
            } />

            <Route path="/profile" element={
                <AppLayout>
                    <Profile />
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
                        <SidebarProvider>
                            <DailyMapCtxProvider>
                                <AppContent />
                            </DailyMapCtxProvider>
                        </SidebarProvider>
                    </BrowserRouter>
                </TooltipProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

export default App;