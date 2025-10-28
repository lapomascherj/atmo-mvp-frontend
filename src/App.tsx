import {Toaster} from "@/components/molecules/Toaster.tsx";
import {Toaster as Sonner} from "@/components/organisms/Sonner.tsx";
import {TooltipProvider} from "@/components/atoms/Tooltip.tsx";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";
import React from "react";
import ErrorBoundary from "@/components/atoms/ErrorBoundary.tsx";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Onboarding from "./pages/Onboarding";
import EnhancedOnboarding from "./pages/EnhancedOnboarding";
import TestOnboarding from "./pages/TestOnboarding";
import MockAuthBypass from "./components/auth/MockAuthBypass";
import DigitalBrain from "./pages/DigitalBrain";
import Profile from "./pages/Profile";

// Components
import NavSidebar from "./components/molecules/NavSidebar.tsx";
import {DailyMapCtxProvider} from "@/context/DailyMapCtx.tsx";
import {SidebarProvider, useSidebar} from "@/context/SidebarContext.tsx";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import {AuthProvider} from "@/context/AuthContext";

const queryClient = new QueryClient();

// Router configuration with future flags
const routerConfig = {
  future: {
    v7_relativeSplatPath: true,
  },
};

// Simple layout component without authentication
const AppLayout: React.FC<{children: React.ReactNode}> = ({children}) => {
    const { sidebarWidth } = useSidebar();

    return (
        <div className="h-screen w-screen overflow-hidden fixed inset-0">
            <NavSidebar/>
            <main className="fixed top-0 bottom-0 right-0 overflow-hidden overflow-y-auto" style={{ left: sidebarWidth }}>
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
            <Route path="/" element={
                <ProtectedRoute>
                    <AppLayout>
                        <Index />
                    </AppLayout>
                </ProtectedRoute>
            } />

            {/* Public Auth Routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />

            {/* Onboarding Routes (Protected) */}
            <Route path="/onboarding" element={
                <ProtectedRoute>
                    <EnhancedOnboarding />
                </ProtectedRoute>
            } />
            
            <Route path="/onboarding/legacy" element={
                <ProtectedRoute>
                    <Onboarding />
                </ProtectedRoute>
            } />
            
            <Route path="/test-onboarding" element={
                <ProtectedRoute>
                    <TestOnboarding />
                </ProtectedRoute>
            } />
            
            <Route path="/demo" element={<MockAuthBypass />} />

            {/* Protected App Routes */}
            <Route path="/app" element={
                <ProtectedRoute>
                    <AppLayout>
                        <Index />
                    </AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/dashboard" element={<Navigate to="/app" replace />} />

            <Route path="/profile" element={
                <ProtectedRoute>
                    <AppLayout>
                        <Profile />
                    </AppLayout>
                </ProtectedRoute>
            } />

            <Route path="/digital-brain" element={
                <ProtectedRoute>
                    <AppLayout>
                        <DigitalBrain />
                    </AppLayout>
                </ProtectedRoute>
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
                    <BrowserRouter future={routerConfig.future}>
                        <AuthProvider>
                            <SidebarProvider>
                                <DailyMapCtxProvider>
                                    <AppContent />
                                </DailyMapCtxProvider>
                            </SidebarProvider>
                        </AuthProvider>
                    </BrowserRouter>
                </TooltipProvider>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

export default App;
