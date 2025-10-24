import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import {
  LayoutDashboard,
  CreditCard,
  Shield,
  User,
  BarChart3,
  TrendingUp,
  Award,
  Activity,
  Settings,
  Download,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Camera,
  Trash2,
  LogOut,
  Loader2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  FileText,
  Lock,
  Key,
  Smartphone,
  Mail,
  Globe,
  Calendar,
  Users,
  Zap,
  Target,
  Star,
  ChevronRight,
  Plus,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import useRealAuth from '@/hooks/useRealAuth';
import { useToast } from '@/hooks/useToast';
import { useGlobalStore } from '@/stores/globalStore';
import { Button } from '@/components/atoms/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/Avatar';
import { Input } from '@/components/atoms/Input';
import { TextArea } from '@/components/atoms/TextArea';
import { Switch } from '@/components/atoms/Switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Progress } from '@/components/atoms/Progress';
import { cn } from '@/utils/utils';

// New simplified tab configuration
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
    description: 'Your productivity analytics and achievements.',
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: CreditCard,
    description: 'Subscription management and usage analytics.',
  },
  {
    id: 'privacy',
    label: 'Privacy',
    icon: Shield,
    description: 'Data controls and security settings.',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    description: 'Personal information and social links.',
  },
];

// Overview & Analytics Tab
const OverviewTab: React.FC<{ user: any }> = ({ user }) => {
  // Mock data - replace with real analytics
  const stats = {
    projectsCompleted: 12,
    tasksDone: 156,
    goalsAchieved: 8,
    currentStreak: 7,
    weeklyProgress: 85,
    monthlyProgress: 92,
  };

  const achievements = [
    { id: 1, title: 'First Project', description: 'Completed your first project', date: '2 days ago', icon: Target },
    { id: 2, title: 'Task Master', description: 'Completed 100+ tasks', date: '1 week ago', icon: CheckCircle },
    { id: 3, title: 'Goal Crusher', description: 'Achieved 5+ goals', date: '2 weeks ago', icon: Star },
  ];

  const recentActivity = [
    { id: 1, action: 'Completed task', project: 'Website Redesign', time: '2 hours ago' },
    { id: 2, action: 'Created goal', project: 'Learn React', time: '1 day ago' },
    { id: 3, action: 'Updated project', project: 'Mobile App', time: '2 days ago' },
  ];

  return (
    <div className="space-y-6">
      {/* Personal Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-900/60 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">This Week</span>
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
                <span className="text-sm text-white/60">This Month</span>
                <span className="text-sm font-medium text-white">{stats.monthlyProgress}%</span>
          </div>
              <Progress value={stats.monthlyProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
            </div>

      {/* Achievements */}
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
                <achievement.icon className="h-6 w-6 text-yellow-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{achievement.title}</p>
                  <p className="text-xs text-white/60">{achievement.description}</p>
            </div>
                <span className="text-xs text-white/40">{achievement.date}</span>
          </div>
            ))}
        </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
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
                <div>
                  <p className="text-sm text-white">{activity.action}</p>
                  <p className="text-xs text-white/60">{activity.project}</p>
        </div>
                <span className="text-xs text-white/40">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Billing Tab
const BillingTab: React.FC<{ user: any }> = ({ user }) => {
  const [showUsageDetails, setShowUsageDetails] = useState(false);

  // Mock billing data
  const subscription = {
    plan: 'Pro',
    status: 'Active',
    renewalDate: '2024-02-15',
    price: '$29/month',
    usage: {
      apiCalls: 1250,
      storage: '2.3 GB',
      features: ['AI Chat', 'Document Generation', 'Analytics'],
    },
  };

  const billingHistory = [
    { id: 1, date: '2024-01-15', amount: '$29.00', status: 'Paid', invoice: 'INV-001' },
    { id: 2, date: '2023-12-15', amount: '$29.00', status: 'Paid', invoice: 'INV-002' },
    { id: 3, date: '2023-11-15', amount: '$29.00', status: 'Paid', invoice: 'INV-003' },
  ];

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
      <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-white/60">Plan</p>
              <p className="text-lg font-semibold text-white">{subscription.plan}</p>
      </div>
            <div className="space-y-2">
              <p className="text-sm text-white/60">Status</p>
              <Badge variant="outline" className="text-green-400 border-green-400">
                {subscription.status}
              </Badge>
      </div>
            <div className="space-y-2">
              <p className="text-sm text-white/60">Price</p>
              <p className="text-lg font-semibold text-white">{subscription.price}</p>
      </div>
            <div className="space-y-2">
              <p className="text-sm text-white/60">Renewal Date</p>
              <p className="text-lg font-semibold text-white">{subscription.renewalDate}</p>
    </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Analytics */}
      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">API Calls This Month</span>
              <span className="text-sm font-medium text-white">{subscription.usage.apiCalls}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Storage Used</span>
              <span className="text-sm font-medium text-white">{subscription.usage.storage}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Active Features</span>
              <span className="text-sm font-medium text-white">{subscription.usage.features.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {billingHistory.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div>
                  <p className="text-sm text-white">{invoice.invoice}</p>
                  <p className="text-xs text-white/60">{invoice.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{invoice.amount}</p>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    {invoice.status}
                  </Badge>
                </div>
          </div>
        ))}
      </div>
        </CardContent>
      </Card>

      {/* Plan Management */}
      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Plan Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Upgrade Plan
            </Button>
            <Button variant="outline" className="w-full border-white/20 text-white/80">
              Download Invoices
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Privacy Tab
const PrivacyTab: React.FC<{ user: any }> = ({ user }) => {
  const [showDataDetails, setShowDataDetails] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Data Storage</p>
                <p className="text-xs text-white/60">Your data is stored securely in encrypted databases</p>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400">
                Secure
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Data Usage</p>
                <p className="text-xs text-white/60">Data is used only to improve your ATMO experience</p>
              </div>
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                Limited
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-white/60">
              Download your personal data, conversations, and settings.
            </p>
            <Button variant="outline" className="border-white/20 text-white/80">
              <Download className="h-4 w-4 mr-2" />
              Export All Data
              </Button>
            </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
                <p className="text-xs text-white/60">Add an extra layer of security to your account</p>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={setTwoFactorEnabled}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Login History</p>
                <p className="text-xs text-white/60">View recent login activity</p>
          </div>
              <Button variant="ghost" size="sm" className="text-white/60">
                View History
          </Button>
      </div>
      </div>
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Data Retention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Chat History</p>
                <p className="text-xs text-white/60">Kept for 90 days, then archived</p>
              </div>
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                90 days
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Personal Data</p>
                <p className="text-xs text-white/60">Kept until account deletion</p>
              </div>
              <Badge variant="outline" className="text-green-400 border-green-400">
                Permanent
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Profile Tab
const ProfileTab: React.FC<{ user: any }> = ({ user }) => {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState({
    linkedin: '',
    twitter: '',
    website: '',
  });
  const [bio, setBio] = useState('');
  const [contactInfo, setContactInfo] = useState({
    email: user?.email || '',
    phone: '',
  });

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarChange = (file: File | null) => {
    if (!file) {
      setAvatarPreview(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
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
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border border-white/15 bg-white/5">
              {avatarPreview ? (
                <AvatarImage src={avatarPreview} alt="Profile" className="object-cover" />
              ) : (
                <AvatarFallback className="text-2xl text-white/80">
                  {user?.display_name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="border-white/20 text-white/80"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-2" />
                Change Avatar
              </Button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleAvatarChange(event.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-white/60">JPG, PNG or GIF. Max size 5MB.</p>
            </div>
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
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/80">LinkedIn</label>
        <Input
                value={socialLinks.linkedin}
                onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/yourname"
          className="bg-white/5 border-white/10 text-white"
        />
            </div>
            <div>
              <label className="text-sm font-medium text-white/80">Twitter</label>
        <Input
                value={socialLinks.twitter}
                onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                placeholder="https://twitter.com/yourname"
          className="bg-white/5 border-white/10 text-white"
        />
            </div>
            <div>
              <label className="text-sm font-medium text-white/80">Website</label>
        <Input
                value={socialLinks.website}
                onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                placeholder="https://yourwebsite.com"
          className="bg-white/5 border-white/10 text-white"
        />
      </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      <Card className="bg-slate-900/60 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="h-5 w-5" />
            Bio
          </CardTitle>
        </CardHeader>
        <CardContent>
      <TextArea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
        rows={4}
        className="bg-white/5 border-white/10 text-white"
      />
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
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/80">Email</label>
        <Input
                value={contactInfo.email}
                onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
          className="bg-white/5 border-white/10 text-white"
                disabled
        />
      </div>
            <div>
              <label className="text-sm font-medium text-white/80">Phone (Optional)</label>
      <Input
                value={contactInfo.phone}
                onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
        className="bg-white/5 border-white/10 text-white"
      />
        </div>
    </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Tabs = TabsPrimitive.Root;
const TabsList = TabsPrimitive.List;
const TabsTrigger = TabsPrimitive.Trigger;
const TabsContent = TabsPrimitive.Content;

const Profile: React.FC = () => {
  const { profile, signOut, isLoading } = useRealAuth();
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState('overview');

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
          <header className="mb-10 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border border-white/15 bg-white/5">
                  <AvatarFallback className="text-lg text-white/80">
                {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-semibold text-white">Profile</h1>
                <p className="text-sm text-white/60">
                Manage your account, view analytics, and control your data.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Button
                  variant="ghost"
                  className="text-red-400 hover:text-red-300"
                  onClick={signOut}
                >
                  <LogOut size={16} className="mr-2" /> Sign out
                </Button>
              </div>
        </header>

            <section className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-sm flex flex-col max-h-[calc(100vh-200px)]">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex flex-col h-full">
                <TabsList className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-white/5 px-5 py-3 flex-shrink-0">
                  {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
                    <TabsTrigger
                      key={id}
                      value={id}
                      className={cn(
                        'flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors',
                        currentTab === id
                          ? 'bg-white/20 text-white shadow-inner shadow-white/15'
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                      )}
                    >
                      <Icon size={16} />
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {TAB_CONFIG.map(({ id, description }) => (
                  <TabsContent key={id} value={id} className="flex-1 overflow-y-auto p-6">
                    <div className="mb-6">
                      <p className="text-sm text-white/50">{description}</p>
                    </div>
                {id === 'overview' && <OverviewTab user={profile} />}
                {id === 'billing' && <BillingTab user={profile} />}
                {id === 'privacy' && <PrivacyTab user={profile} />}
                {id === 'profile' && <ProfileTab user={profile} />}
                  </TabsContent>
                ))}
              </Tabs>
            </section>
          </div>
        </div>
  );
};

export default Profile;