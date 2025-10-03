import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useRealAuth } from '@/hooks/useRealAuth';
import { Mail, Loader2, CheckCircle } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const { requestPasswordReset } = useRealAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    const success = await requestPasswordReset(email);
    setIsLoading(false);

    if (success) {
      setEmailSent(true);
    }
  };

  if (emailSent) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle="Password reset instructions sent"
      >
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <p className="text-white/80 mb-6">
            We've sent password reset instructions to <strong className="text-white">{email}</strong>
          </p>
          <p className="text-white/60 text-sm mb-8">
            Please check your inbox and follow the link to reset your password.
          </p>
          <Link
            to="/auth/login"
            className="inline-block px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email to receive reset instructions"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-white/90">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={18} className="text-white/40" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
              placeholder="you@example.com"
              autoComplete="email"
              aria-label="Email Address"
            />
          </div>
          {error && (
            <p className="text-red-400 text-xs mt-1">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-[#CC5500] hover:bg-[#CC5500]/90 text-white font-semibold rounded-lg transition-all duration-300 ease-out transform hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            'Send Reset Link'
          )}
        </button>

        <div className="text-center pt-4 border-t border-white/10">
          <Link
            to="/auth/login"
            className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            ← Back to Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
