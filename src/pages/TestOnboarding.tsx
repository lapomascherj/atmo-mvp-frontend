import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/Card';

const TestOnboarding: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-white text-center">Enhanced Onboarding Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-white/70 text-center">
            Test the enhanced onboarding system
          </p>
          <div className="space-y-2">
            <Button 
              onClick={() => navigate('/onboarding')}
              className="w-full bg-blue-400 hover:bg-blue-500 text-white"
            >
              Enhanced Onboarding
            </Button>
            <Button 
              onClick={() => navigate('/onboarding/legacy')}
              variant="ghost"
              className="w-full text-white/70 hover:text-white"
            >
              Legacy Onboarding
            </Button>
            <Button 
              onClick={() => navigate('/app')}
              variant="ghost"
              className="w-full text-white/70 hover:text-white"
            >
              Go to App
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestOnboarding;
