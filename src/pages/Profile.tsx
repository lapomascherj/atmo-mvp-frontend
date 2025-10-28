import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import {
  LayoutDashboard,
  CreditCard,
  Shield,
  User as UserIcon,
  BarChart3,
  TrendingUp,
  Award,
  Activity,
  Settings,
  Download,
  Link as LinkIcon,
  Camera,
  LogOut,
  Loader2,
  CheckCircle,
  Clock,
  FileText,
  Lock,
  Mail,
  Zap,
  Target,
  Star,
  Save,
  Upload,
  AlertCircle,
} from 'lucide-react';
import useRealAuth from '@/hooks/useRealAuth';
import { useToast } from '@/hooks/useToast';
import { usePersonasStore } from '@/stores/usePersonasStore';
import { Button } from '@/components/atoms/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/Avatar';
import { Input } from '@/components/atoms/Input';
import { TextArea } from '@/components/atoms/TextArea';
import { Switch } from '@/components/atoms/Switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Progress } from '@/components/atoms/Progress';
import { cn } from '@/utils/utils';
import { calculatePersonalStats } from '@/utils/personalSnapshotAnalyzer';
import { Status } from '@/models/Status';
import { supabase } from '@/lib/supabase';

// Tab configuration
const TAB_CONFIG: Array<{
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  description: string;
}> = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    description: 'Your productivity analytics and real achievements.',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: UserIcon,
    description: 'Personal information and social links.',
  },
  {
    id: 'privacy',
    label: 'Privacy',
    icon: Shield,
    description: 'Data controls and security settings.',
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: CreditCard,
    description: 'Manage your subscription and view payment history.',
  },
];

// Overview & Analytics Tab with REAL DATA
const OverviewTab: React.FC<{ user: any }> = ({ user }) => {
  const { projects, getProjects, getTasks, getGoals } = usePersonasStore();

  // Calculate real stats from actual data
  const stats = useMemo(() => {
    const allProjects = getProjects();
    const allTasks = getTasks();
    const allGoals = getGoals();

    const projectsCompleted = allProjects.filter(p => p.status === 'completed' || p.progress === 100).length;
    const tasksDone = allTasks.filter(t => t.completed).length;
    const goalsAchieved = allGoals.filter(g => g.status === Status.Completed).length;
    const currentStreak = user?.active_streak_days || 0;

    // Calculate weekly progress (tasks completed in last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyTasks = allTasks.filter(t => t.completed && t.updated_at && new Date(t.updated_at) >= oneWeekAgo);
    const weeklyProgress = allTasks.length > 0 ? Math.round((weeklyTasks.length / Math.max(allTasks.length, 10)) * 100) : 0;

    // Calculate monthly progress (tasks completed in last 30 days)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const monthlyTasks = allTasks.filter(t => t.completed && t.updated_at && new Date(t.updated_at) >= oneMonthAgo);
    const monthlyProgress = allTasks.length > 0 ? Math.round((monthlyTasks.length / Math.max(allTasks.length, 10)) * 100) : 0;

    return {
      projectsCompleted,
      tasksDone,
      goalsAchieved,
      currentStreak,
      weeklyProgress: Math.min(weeklyProgress, 100),
      monthlyProgress: Math.min(monthlyProgress, 100),
    };
  }, [projects, getProjects, getTasks, getGoals, user]);

  // Generate real achievements from completed goals
  const achievements = useMemo(() => {
    const allGoals = getGoals();
    const completedGoals = allGoals
      .filter(g => g.status === Status.Completed && g.completedDate)
      .sort((a, b) => new Date(b.completedDate!).getTime() - new Date(a.completedDate!).getTime())
      .slice(0, 5);

    return completedGoals.map((goal, index) => {
      const daysAgo = Math.floor((Date.now() - new Date(goal.completedDate!).getTime()) / (1000 * 60 * 60 * 24));
      const timeAgo = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;

      return {
        id: goal.id,
        title: goal.name,
        description: goal.description || `Completed goal: ${goal.name}`,
        date: timeAgo,
        icon: index === 0 ? Star : Target,
      };
    });
  }, [getGoals]);

  // Generate real activity feed from recent task completions
  const recentActivity = useMemo(() => {
    const allTasks = getTasks();
    const allProjects = getProjects();

    const recentTasks = allTasks
      .filter(t => t.completed && t.updated_at)
      .sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime())
      .slice(0, 5);

    return recentTasks.map(task => {
      const project = allProjects.find(p => p.id === task.projectId);
      const hoursAgo = Math.floor((Date.now() - new Date(task.updated_at!).getTime()) / (1000 * 60 * 60));
      const timeAgo = hoursAgo < 1 ? 'Just now' : hoursAgo < 24 ? `${hoursAgo} hours ago` : `${Math.floor(hoursAgo / 24)} days ago`;

      return {
        id: task.id,
        action: 'Completed task',
        project: project?.name || 'Unknown project',
        taskName: task.name,
        time: timeAgo,
      };
    });
  }, [getTasks, getProjects]);

  return (
    <div className="space-y-6">
      {/* Personal Stats */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900/60 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Projects Completed</p>
                <p className="text-2xl font-bold text-white">{stats.projectsCompleted}</p>
              </div>
              <Target className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Tasks Done</p>
                <p className="text-2xl font-bold text-white">{stats.tasksDone}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Goals Achieved</p>
                <p className="text-2xl font-bold text-white">{stats.goalsAchieved}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Current Streak</p>
                <p className="text-2xl font-bold text-white">{stats.currentStreak} days</p>
              </div>
              <Zap className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Charts */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card className="bg-slate-900/60 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Tasks Completed This Week</span>
                <span className="text-sm font-medium text-white">{stats.weeklyProgress}%</span>
              </div>
              <Progress value={stats.weeklyProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Tasks Completed This Month</span>
                <span className="text-sm font-medium text-white">{stats.monthlyProgress}%</span>
              </div>
              <Progress value={stats.monthlyProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      {achievements.length > 0 ? (
        <Card className="bg-slate-900/60 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="h-5 w-5" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
                  <achievement.icon className="h-6 w-6 text-yellow-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{achievement.title}</p>
                    <p className="text-xs text-white/60 truncate">{achievement.description}</p>
                  </div>
                  <span className="text-xs text-white/40 flex-shrink-0">{achievement.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-900/60 border-white/10">
          <CardContent className="p-6">
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/60 mb-2">No achievements yet</p>
              <p className="text-xs text-white/40">Complete goals to unlock achievements!</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 ? (
        <Card className="bg-slate-900/60 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{activity.taskName}</p>
                    <p className="text-xs text-white/60 truncate">{activity.project}</p>
                  </div>
                  <span className="text-xs text-white/40 flex-shrink-0 ml-4">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-900/60 border-white/10">
          <CardContent className="p-6">
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/60 mb-2">No recent activity</p>
              <p className="text-xs text-white/40">Start completing tasks to see your activity here!</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Profile Tab with REAL DATA
const ProfileTab: React.FC<{ user: any; onSave: (data: any) => Promise<void> }> = ({ user, onSave }) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar_url || null);
  const [displayName, setDisplayName] = useState(user?.display_name || user?.nickname || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [socialLinks, setSocialLinks] = useState({
    linkedin: user?.onboarding_data?.linkedin || '',
    twitter: user?.onboarding_data?.twitter || '',
    website: user?.onboarding_data?.website || '',
  });
  const [jobTitle, setJobTitle] = useState(user?.job_title || '');
  const [company, setCompany] = useState(user?.company || '');

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarUpload = async (file: File | null) => {
    if (!file || !user?.id) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please upload an image smaller than 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);

      await onSave({ avatar_url: publicUrl });

      toast({ title: 'Success', description: 'Profile picture updated' });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        display_name: displayName,
        bio,
        job_title: jobTitle,
        company,
        onboarding_data: {
          ...user?.onboarding_data,
          linkedin: socialLinks.linkedin,
          twitter: socialLinks.twitter,
          website: socialLinks.website,
        },
      });
      toast({ title: 'Success', description: 'Profile updated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Picture */}
      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Profile Picture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-white/15 bg-gradient-to-br from-slate-800 to-slate-900">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="Profile" className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                    <UserIcon className="h-12 w-12 text-white/60" />
                  </AvatarFallback>
                )}
              </Avatar>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="border-white/20 text-white/80 hover:bg-white/10"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Change Picture
                  </>
                )}
              </Button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAvatarUpload(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-white/60">JPG, PNG or GIF. Max size 5MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white/80 block mb-2">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-white/80 block mb-2">Job Title</label>
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., Product Manager"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-white/80 block mb-2">Company</label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Your company"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-white/80 block mb-2">Bio</label>
            <TextArea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Social Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white/80 block mb-2">LinkedIn</label>
            <Input
              value={socialLinks.linkedin}
              onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
              placeholder="https://linkedin.com/in/yourname"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-white/80 block mb-2">Twitter</label>
            <Input
              value={socialLinks.twitter}
              onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
              placeholder="https://twitter.com/yourname"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-white/80 block mb-2">Website</label>
            <Input
              value={socialLinks.website}
              onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
              placeholder="https://yourwebsite.com"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white/80 block mb-2">Email</label>
            <Input
              value={user?.email || ''}
              disabled
              className="bg-white/5 border-white/10 text-white/60 cursor-not-allowed"
            />
            <p className="text-xs text-white/40 mt-1">Email cannot be changed</p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// Billing Tab with REAL STRUCTURE
const BillingTab: React.FC<{ user: any }> = ({ user }) => {
  const { toast } = useToast();

  // This would come from your payment provider (Stripe, etc.)
  // For now, showing the structure for when you integrate payments
  const subscription = {
    status: 'Free Plan', // Will be 'Active', 'Cancelled', etc. when payments are integrated
    plan: 'Free',
    price: '$0/month',
    nextBillingDate: null,
    features: [
      'Unlimited Projects',
      'Unlimited Goals & Tasks',
      'AI Chat Assistant',
      'Basic Analytics',
    ],
  };

  // Payment history will be fetched from your payment provider
  // Structure ready for real payment data
  const paymentHistory: Array<{
    id: string;
    date: string;
    amount: string;
    status: 'paid' | 'pending' | 'failed';
    invoice?: string;
  }> = [];

  const handleUpgrade = () => {
    toast({
      title: 'Coming Soon',
      description: 'Paid plans will be available soon!',
    });
    // TODO: Integrate with payment provider (Stripe, etc.)
  };

  const handleManageBilling = () => {
    toast({
      title: 'Coming Soon',
      description: 'Billing portal will be available when payments are integrated',
    });
    // TODO: Redirect to payment provider's customer portal
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-white">{subscription.plan}</h3>
                  <Badge
                    variant="outline"
                    className={cn(
                      subscription.status === 'Free Plan'
                        ? 'text-blue-400 border-blue-400'
                        : 'text-green-400 border-green-400'
                    )}
                  >
                    {subscription.status}
                  </Badge>
                </div>
                <p className="text-white/60 text-sm">{subscription.price}</p>
                {subscription.nextBillingDate && (
                  <p className="text-white/40 text-xs mt-1">
                    Next billing date: {subscription.nextBillingDate}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleUpgrade}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Upgrade Plan
                </Button>
                {subscription.status !== 'Free Plan' && (
                  <Button
                    onClick={handleManageBilling}
                    variant="outline"
                    className="border-white/20 text-white/80 hover:bg-white/10"
                  >
                    Manage Billing
                  </Button>
                )}
              </div>
            </div>

            {/* Features */}
            <div>
              <p className="text-sm font-medium text-white/80 mb-3">Included Features:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {subscription.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentHistory.length > 0 ? (
            <div className="space-y-3">
              {paymentHistory.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      payment.status === 'paid' && "bg-green-500/20",
                      payment.status === 'pending' && "bg-yellow-500/20",
                      payment.status === 'failed' && "bg-red-500/20"
                    )}>
                      {payment.status === 'paid' && <CheckCircle className="h-5 w-5 text-green-400" />}
                      {payment.status === 'pending' && <Clock className="h-5 w-5 text-yellow-400" />}
                      {payment.status === 'failed' && <AlertCircle className="h-5 w-5 text-red-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{payment.amount}</p>
                      <p className="text-xs text-white/60">{payment.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        payment.status === 'paid' && "text-green-400 border-green-400",
                        payment.status === 'pending' && "text-yellow-400 border-yellow-400",
                        payment.status === 'failed' && "text-red-400 border-red-400"
                      )}
                    >
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </Badge>
                    {payment.invoice && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/60 hover:text-white"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Invoice
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/60 mb-2">No payment history yet</p>
              <p className="text-xs text-white/40">
                {subscription.status === 'Free Plan'
                  ? 'Upgrade to a paid plan to see your payment history here'
                  : 'Your payments will appear here once processed'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage & Limits (for paid plans) */}
      {subscription.status !== 'Free Plan' && (
        <Card className="bg-slate-900/60 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Usage This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/60">AI Chat Messages</span>
                  <span className="text-sm font-medium text-white">45 / 1,000</span>
                </div>
                <Progress value={4.5} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/60">Document Generations</span>
                  <span className="text-sm font-medium text-white">12 / 100</span>
                </div>
                <Progress value={12} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/60">Storage Used</span>
                  <span className="text-sm font-medium text-white">234 MB / 5 GB</span>
                </div>
                <Progress value={4.68} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Information */}
      {subscription.status !== 'Free Plan' && (
        <Card className="bg-slate-900/60 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Billing Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-white/60" />
                  <div>
                    <p className="text-sm font-medium text-white">•••• •••• •••• 4242</p>
                    <p className="text-xs text-white/60">Expires 12/2025</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white"
                  onClick={handleManageBilling}
                >
                  Update
                </Button>
              </div>
              <p className="text-xs text-white/40">
                Payment details are securely managed by our payment provider
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Privacy Tab with REAL DATA
const PrivacyTab: React.FC<{ user: any }> = ({ user }) => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const { projects, getTasks, getGoals } = usePersonasStore();

  const handleExportData = async () => {
    setExporting(true);
    try {
      const exportData = {
        profile: user,
        projects: projects,
        goals: getGoals(),
        tasks: getTasks(),
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atmo-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Success', description: 'Your data has been exported' });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to export data', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const accountCreatedDate = user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown';

  return (
    <div className="space-y-6">
      {/* Data Privacy */}
      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data Privacy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Account Created</p>
                <p className="text-xs text-white/60">Your account was created on {accountCreatedDate}</p>
              </div>
              <Clock className="h-5 w-5 text-blue-400 flex-shrink-0 ml-4" />
            </div>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Data Storage</p>
                <p className="text-xs text-white/60">Your data is stored securely with Supabase encryption</p>
              </div>
              <Lock className="h-5 w-5 text-green-400 flex-shrink-0 ml-4" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Your Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-white/60">
              Download all your personal data including projects, goals, tasks, and profile information.
            </p>
            <Button
              variant="outline"
              className="border-white/20 text-white/80 hover:bg-white/10"
              onClick={handleExportData}
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Authentication</p>
                <p className="text-xs text-white/60">Secured with Supabase Auth</p>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400 flex-shrink-0 ml-4">
                Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Tabs components
const Tabs = TabsPrimitive.Root;
const TabsList = TabsPrimitive.List;
const TabsTrigger = TabsPrimitive.Trigger;
const TabsContent = TabsPrimitive.Content;

const Profile: React.FC = () => {
  const { profile, signOut, isLoading, updateUserProfile } = useRealAuth();
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState('overview');

  const handleSaveProfile = async (updates: any) => {
    const success = await updateUserProfile(updates);
    if (!success) {
      throw new Error('Failed to update profile');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/60 mx-auto mb-2" />
          <p className="text-sm text-white/40">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-16">
      <div className="mx-auto max-w-6xl px-6 pt-10">
        {/* Header */}
        <header className="mb-10 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white/15 bg-gradient-to-br from-slate-800 to-slate-900">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt="Profile" className="object-cover" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                  <UserIcon className="h-8 w-8 text-white/60" />
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold text-white">
                {profile?.display_name || profile?.nickname || 'Your Profile'}
              </h1>
              <p className="text-sm text-white/60">
                {profile?.job_title || 'Manage your account and view your progress'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
            onClick={signOut}
          >
            <LogOut size={16} className="mr-2" /> Sign Out
          </Button>
        </header>

        {/* Tabs Section */}
        <section className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-sm overflow-hidden">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex flex-col">
            <TabsList className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-white/5 px-6 py-4">
              {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
                <TabsTrigger
                  key={id}
                  value={id}
                  className={cn(
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                    currentTab === id
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  )}
                >
                  <Icon size={16} />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {TAB_CONFIG.map(({ id, description }) => (
              <TabsContent key={id} value={id} className="p-6 overflow-y-auto max-h-[calc(100vh-280px)]">
                <div className="mb-6">
                  <p className="text-sm text-white/50">{description}</p>
                </div>
                {id === 'overview' && <OverviewTab user={profile} />}
                {id === 'profile' && <ProfileTab user={profile} onSave={handleSaveProfile} />}
                {id === 'privacy' && <PrivacyTab user={profile} />}
                {id === 'billing' && <BillingTab user={profile} />}
              </TabsContent>
            ))}
          </Tabs>
        </section>
      </div>
    </div>
  );
};

export default Profile;
