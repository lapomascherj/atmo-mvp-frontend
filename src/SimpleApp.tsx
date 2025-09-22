import React from 'react';
import DashboardLayout from './components/organisms/DashboardLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const SimpleApp: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <DashboardLayout userName="Dev User" />
      </div>
    </QueryClientProvider>
  );
};

export default SimpleApp;