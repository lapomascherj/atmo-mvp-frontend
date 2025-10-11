import React from 'react';
import DashboardLayout from '@/components/organisms/DashboardLayout.tsx';
import { useMockAuth } from '@/hooks/useMockAuth';

const Index = () => {
  const { user } = useMockAuth();
  const userName = user?.nickname || user?.email?.split('@')[0] || 'Explorer';

  return <DashboardLayout userName={userName} />;
};

export default Index;
