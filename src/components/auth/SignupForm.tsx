import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRealAuth } from '@/hooks/useRealAuth';
import { Eye, EyeOff, Mail, Lock, User, Loader2, Check, X } from 'lucide-react';

export const SignupForm: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isLoading, error, clearError } = useRealAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    passwordConfirm?: string;
  }>({});

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 1, label: 'Weak', color: 'text-red-400' };
    if (password.length < 8) return { strength: 2, label: 'Fair', color: 'text-orange-400' };
    if (password.length < 12) return { strength: 3, label: 'Good', color: 'text-yellow-400' };
    return { strength: 4, label: 'Strong', color: 'text-green-400' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const validateForm = () => {
    const errors: typeof validationErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    // Password confirmation
    if (!formData.passwordConfirm) {
      errors.passwordConfirm = 'Please confirm your password';
    } else if (formData.password !== formData.passwordConfirm) {
      errors.passwordConfirm = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validateForm()) return;

    const success = await signup(
      formData.email,
      formData.password,
      formData.passwordConfirm,
      formData.name
    );

    if (success) {
      // Redirect to onboarding
      navigate('/onboarding', { replace: true });
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: undefined });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name Field */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-white/90">
          Full Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User
              size={18}
              className="text-slate-500 transition-colors dark:text-white/70"
            />
          </div>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${
              validationErrors.name ? 'border-red-500/50' : 'border-white/10'
            } rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200`}
            placeholder="John Doe"
            autoComplete="name"
            aria-label="Full Name"
          />
        </div>
        {validationErrors.name && (
          <p className="text-red-400 text-xs mt-1">{validationErrors.name}</p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-white/90">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail
              size={18}
              className="text-slate-500 transition-colors dark:text-white/70"
            />
          </div>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${
              validationErrors.email ? 'border-red-500/50' : 'border-white/10'
            } rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200`}
            placeholder="you@example.com"
            autoComplete="email"
            aria-label="Email Address"
          />
        </div>
        {validationErrors.email && (
          <p className="text-red-400 text-xs mt-1">{validationErrors.email}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-white/90">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock
              size={18}
              className="text-slate-500 transition-colors dark:text-white/70"
            />
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => updateField('password', e.target.value)}
            className={`w-full pl-10 pr-12 py-3 bg-white/5 border ${
              validationErrors.password ? 'border-red-500/50' : 'border-white/10'
            } rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200`}
            placeholder="••••••••"
            autoComplete="new-password"
            aria-label="Password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-600 dark:text-white/70 dark:hover:text-white transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Password Strength Indicator */}
        {formData.password && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    level <= passwordStrength.strength
                      ? level === 1
                        ? 'bg-red-500'
                        : level === 2
                        ? 'bg-orange-500'
                        : level === 3
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                      : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
            <p className={`text-xs ${passwordStrength.color}`}>
              {passwordStrength.label}
            </p>
          </div>
        )}
        {validationErrors.password && (
          <p className="text-red-400 text-xs mt-1">{validationErrors.password}</p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <label htmlFor="passwordConfirm" className="block text-sm font-medium text-white/90">
          Confirm Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock
              size={18}
              className="text-slate-500 transition-colors dark:text-white/70"
            />
          </div>
          <input
            id="passwordConfirm"
            type={showPasswordConfirm ? 'text' : 'password'}
            value={formData.passwordConfirm}
            onChange={(e) => updateField('passwordConfirm', e.target.value)}
            className={`w-full pl-10 pr-12 py-3 bg-white/5 border ${
              validationErrors.passwordConfirm ? 'border-red-500/50' : 'border-white/10'
            } rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200`}
            placeholder="••••••••"
            autoComplete="new-password"
            aria-label="Confirm Password"
          />
          <button
            type="button"
            onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-600 dark:text-white/70 dark:hover:text-white transition-colors"
            aria-label={showPasswordConfirm ? 'Hide password' : 'Show password'}
          >
            {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          {formData.passwordConfirm && formData.password === formData.passwordConfirm && (
            <div className="absolute inset-y-0 right-10 flex items-center pr-3 pointer-events-none">
              <Check size={18} className="text-green-400" />
            </div>
          )}
          {formData.passwordConfirm && formData.password !== formData.passwordConfirm && (
            <div className="absolute inset-y-0 right-10 flex items-center pr-3 pointer-events-none">
              <X size={18} className="text-red-400" />
            </div>
          )}
        </div>
        {validationErrors.passwordConfirm && (
          <p className="text-red-400 text-xs mt-1">{validationErrors.passwordConfirm}</p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-[#CC5500] hover:bg-[#CC5500]/90 text-white font-semibold rounded-lg transition-all duration-300 ease-out transform hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>Creating account...</span>
          </>
        ) : (
          'Create Account'
        )}
      </button>

      {/* Terms & Privacy */}
      <p className="text-xs text-white/50 text-center">
        By signing up, you agree to our{' '}
        <a href="#" className="text-blue-400 hover:text-blue-300">Terms of Service</a>
        {' '}and{' '}
        <a href="#" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>
      </p>

      {/* Login Link */}
      <div className="text-center pt-4 border-t border-white/10">
        <p className="text-sm text-white/60">
          Already have an account?{' '}
          <Link
            to="/auth/login"
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
};
