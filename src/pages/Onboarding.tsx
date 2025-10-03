import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRealAuth } from '@/hooks/useRealAuth';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { Loader2, ArrowRight, Sparkles } from 'lucide-react';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useRealAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    nickname: user?.name || '',
    jobTitle: '',
    bio: '',
    biggestChallenge: '',
    focus: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      // Update or create persona
      const personas = await pb.collection('personas').getFullList({
        filter: `iam = "${user.id}"`
      });

      if (personas.length > 0) {
        // Update existing persona
        await pb.collection('personas').update(personas[0].id, {
          nickname: formData.nickname,
          job_title: formData.jobTitle,
          bio: formData.bio,
          biggest_challenge: formData.biggestChallenge,
          focus: formData.focus,
          onboarding_completed: true,
        });
      } else {
        // This shouldn't happen as persona is created during signup
        await pb.collection('personas').create({
          iam: user.id,
          nickname: formData.nickname,
          email: user.email,
          job_title: formData.jobTitle,
          bio: formData.bio,
          biggest_challenge: formData.biggestChallenge,
          focus: formData.focus,
          onboarding_completed: true,
          email_notifications: true,
          push_notifications: true,
        });
      }

      toast.success('Profile completed!', {
        description: 'Welcome to ATMO. Let\'s get started!',
      });

      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error('Failed to complete setup', {
        description: error?.message || 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[url('/bg-grid.svg')] bg-fixed opacity-[0.01] pointer-events-none" />

      {/* Subtle Glow Effects - matching dashboard */}
      <div className="fixed top-[20%] right-[25%] -z-10 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px] animate-pulse-soft" />
      <div className="fixed top-[60%] left-[15%] -z-10 w-96 h-96 bg-orange-500/3 rounded-full blur-[120px] animate-pulse-soft" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Sparkles size={32} className="text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Let's personalize ATMO for you
          </h1>
          <p className="text-white/60">
            Tell us a bit about yourself to get the best experience
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Form Card */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-orange-500/10 rounded-2xl blur-xl" />

          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Basic Information</h2>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/90">
                      What should we call you?
                    </label>
                    <input
                      type="text"
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Your preferred name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/90">
                      What's your role?
                    </label>
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="e.g., Product Manager, Developer, Founder"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: About You */}
              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Tell us about yourself</h2>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/90">
                      Brief bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                      placeholder="What do you do? What are you passionate about?"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/90">
                      What's your biggest challenge right now?
                    </label>
                    <textarea
                      value={formData.biggestChallenge}
                      onChange={(e) => setFormData({ ...formData, biggestChallenge: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                      placeholder="How can ATMO help you?"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Focus Area */}
              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Your Focus</h2>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/90">
                      What's your main focus right now?
                    </label>
                    <select
                      value={formData.focus}
                      onChange={(e) => setFormData({ ...formData, focus: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="">Select your focus</option>
                      <option value="career">Career Growth</option>
                      <option value="projects">Project Execution</option>
                      <option value="learning">Learning & Development</option>
                      <option value="entrepreneurship">Entrepreneurship</option>
                      <option value="productivity">Personal Productivity</option>
                      <option value="leadership">Leadership</option>
                    </select>
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-300">
                      🎉 You're almost there! Complete setup to start using ATMO.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-8">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-colors"
                  >
                    Back
                  </button>
                )}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={step === 1 && !formData.nickname}
                    className="flex-1 px-6 py-3 bg-[#CC5500] hover:bg-[#CC5500]/90 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Next
                    <ArrowRight size={20} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading || !formData.nickname}
                    className="flex-1 px-6 py-3 bg-[#CC5500] hover:bg-[#CC5500]/90 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Completing Setup...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <Sparkles size={20} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .animate-pulse-soft {
          animation: pulse-soft 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
