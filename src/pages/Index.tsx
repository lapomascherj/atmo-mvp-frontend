import React, { useContext } from 'react';
import DashboardLayout from '@/components/organisms/DashboardLayout.tsx';
import { DailyMapCtx } from '@/context/DailyMapCtx';
import useVoiceRecognition from '@/hooks/useVoiceRecognition.ts';

const Index = () => {
  const dailyMapCtx = useContext(DailyMapCtx);
  
  // Demo user name for frontend-only version
  const userName = 'Demo User';

  // Voice recognition hook for service status
  const { isSupported } = useVoiceRecognition({
    onResult: () => {}, // Empty callback since we only need status
  });

  // Mock service status for frontend-only demo
  const serviceStatus = {
    status: 'ready',
    message: 'is ready to help you plan with intention'
  };

  // User is always "authenticated" in frontend-only mode
  return <DashboardLayout userName={userName} />;
};

export default Index;