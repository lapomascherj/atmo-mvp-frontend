import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/Card';
import { AlertTriangle, ExternalLink } from 'lucide-react';

interface SupabaseConfigurationErrorProps {
  onRetry?: () => void;
}

export const SupabaseConfigurationError: React.FC<SupabaseConfigurationErrorProps> = ({ onRetry }) => {
  const refreshPage = () => {
    // Navigate to home instead of reloading
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Supabase Configuration Required
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-3">
              ATMO requires Supabase to be configured for authentication and data storage.
            </p>
            
            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Quick Setup:</h3>
              <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600">
                <li>Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com</a></li>
                <li>Get your Project URL and anon key from Settings → API</li>
                <li>Create a <code className="bg-gray-200 px-1 rounded">.env</code> file in the project root</li>
                <li>Add your credentials:
                  <div className="mt-1 bg-gray-800 text-green-400 p-2 rounded text-xs font-mono">
                    VITE_SUPABASE_URL=https://your-project.supabase.co<br/>
                    VITE_SUPABASE_ANON_KEY=your-anon-key-here
                  </div>
                </li>
                <li>Run the database migration from <code className="bg-gray-200 px-1 rounded">supabase-migration.sql</code></li>
              </ol>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={refreshPage} variant="outline" className="flex-1">
              Refresh Page
            </Button>
            <Button 
              onClick={() => window.open('https://supabase.com', '_blank')}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Setup Supabase
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            Need help? Check the <code className="bg-gray-200 px-1 rounded">SUPABASE_SETUP.md</code> file for detailed instructions.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseConfigurationError;
