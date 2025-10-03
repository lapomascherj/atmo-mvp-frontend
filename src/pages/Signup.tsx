import React from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { SignupForm } from '@/components/auth/SignupForm';

const Signup: React.FC = () => {
  return (
    <AuthLayout
      title="Join ATMO"
      subtitle="Create your account and start organizing your life"
    >
      <SignupForm />
    </AuthLayout>
  );
};

export default Signup;
