import React, { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';

const TestConnection: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [pbUrl, setPbUrl] = useState<string>('');

  useEffect(() => {
    // Get the PocketBase URL
    setPbUrl(pb.baseUrl);
  }, []);

  const testHealth = async () => {
    setResult('Testing health...');
    try {
      const health = await pb.health.check();
      setResult('✅ Health check SUCCESS!\n' + JSON.stringify(health, null, 2));
    } catch (error: any) {
      setResult('❌ Health check FAILED!\n' + error.message + '\n' + JSON.stringify(error, null, 2));
    }
  };

  const testSignup = async () => {
    setResult('Testing signup...');
    try {
      const email = 'test' + Date.now() + '@test.com';
      const data = {
        email: email,
        password: 'test123456',
        passwordConfirm: 'test123456',
        name: 'Test User',
        emailVisibility: true
      };
      console.log('Sending signup request:', data);
      const user = await pb.collection('users').create(data);
      setResult('✅ Signup SUCCESS!\n' + JSON.stringify(user, null, 2));
    } catch (error: any) {
      console.error('Signup error:', error);
      setResult('❌ Signup FAILED!\n' +
        'Message: ' + error.message + '\n' +
        'Status: ' + error.status + '\n' +
        'Data: ' + JSON.stringify(error.data, null, 2));
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>PocketBase Connection Test</h1>
      <p><strong>PocketBase URL:</strong> {pbUrl}</p>
      <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
      <p><strong>VITE_POCKETBASE_URL:</strong> {import.meta.env.VITE_POCKETBASE_URL}</p>

      <div style={{ marginTop: '20px' }}>
        <button onClick={testHealth} style={{ padding: '10px', marginRight: '10px' }}>
          Test Health
        </button>
        <button onClick={testSignup} style={{ padding: '10px' }}>
          Test Signup
        </button>
      </div>

      <pre style={{
        marginTop: '20px',
        padding: '10px',
        background: '#f0f0f0',
        border: '1px solid #ccc',
        whiteSpace: 'pre-wrap'
      }}>
        {result}
      </pre>
    </div>
  );
};

export default TestConnection;
