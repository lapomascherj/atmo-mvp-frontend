import React from 'react';

const TestApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">ATMO Test</h1>
        <p className="text-lg text-slate-300 mb-8">Application is working!</p>
        <div className="bg-blue-600 text-white px-6 py-3 rounded-lg">
          Server is running on localhost:3000
        </div>
      </div>
    </div>
  );
};

export default TestApp;