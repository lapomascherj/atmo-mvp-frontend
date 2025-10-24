import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { Brain, Zap, Sparkles } from 'lucide-react';

export const MockAuthBypass: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('demo@example.com');
  const [name, setName] = useState('Demo User');

  const handleMockLogin = () => {
    // Store mock user data in localStorage
    const mockUser = {
      id: 'mock-user-123',
      email: email,
      display_name: name,
      onboarding_completed: false,
      onboarding_data: {},
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    localStorage.setItem('mock_user', JSON.stringify(mockUser));
    localStorage.setItem('mock_session', JSON.stringify({
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Date.now() + 3600000, // 1 hour
      user: mockUser
    }));

    // Navigate to enhanced onboarding
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-blue-400/30 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-blue-400 rounded-full flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl font-semibold text-white">
            ATMO Demo Mode
          </CardTitle>
          <p className="text-white/70 text-sm mt-2">
            Test the enhanced onboarding system without Supabase setup
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm text-white/70 mb-1 block">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm text-white/70 mb-1 block">Email</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full"
              />
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-yellow-400" />
              <span className="text-white text-sm font-medium">Demo Features</span>
            </div>
            <div className="space-y-1 text-xs text-white/70">
              <div>• Enhanced conversational onboarding</div>
              <div>• Emotional data collection</div>
              <div>• AI-driven questions</div>
              <div>• Progress tracking</div>
              <div>• Continue later functionality</div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleMockLogin}
              className="w-full bg-blue-400 hover:bg-blue-500 text-white"
            >
              <Sparkles size={16} className="mr-2" />
              Start Enhanced Onboarding Demo
            </Button>
            
            <Button 
              onClick={() => navigate('/test-onboarding')}
              variant="ghost"
              className="w-full text-white/70 hover:text-white"
            >
              Test Onboarding Options
            </Button>
          </div>

          <div className="text-xs text-white/50 text-center">
            This is a demo mode for testing the enhanced onboarding system.
            No real authentication or data storage is used.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MockAuthBypass;
