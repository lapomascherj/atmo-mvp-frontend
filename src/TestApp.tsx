import React from 'react';

const TestApp: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#1a1a1a',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀 ATMO App</h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Development Server Running</p>
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#333', 
          borderRadius: '8px',
          maxWidth: '600px'
        }}>
          <h2 style={{ color: '#FF5F1F', marginBottom: '1rem' }}>✅ React is Working</h2>
          <p>This is a simplified test version to confirm the app loads correctly.</p>
          <p>Authentication bypass is active for development.</p>
        </div>
      </div>
    </div>
  );
};

export default TestApp;