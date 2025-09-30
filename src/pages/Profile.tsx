import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Briefcase, Heart, Settings, Shield,
  Camera, Check, X, LogOut, Loader2,
  MapPin, Globe, Phone, Clock
} from 'lucide-react';
import { useAuth } from '@/hooks/useMockAuth';
import { useToast } from '@/hooks/useToast';
import { useSidebar } from '@/context/SidebarContext';
import { Button } from '@/components/atoms/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/Avatar';
import { Input } from '@/components/atoms/Input';
import { TextArea } from '@/components/atoms/TextArea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/Select';
import { JobTitle } from '@/models/JobTitle';
import { Focus } from '@/models/Focus';

type ProfileSection = 'profile' | 'professional' | 'personal' | 'preferences' | 'account';

const Profile: React.FC = () => {
  const { user, updateUserProfile, signOut } = useAuth();
  const { toast } = useToast();
  const { isCollapsed, sidebarWidth } = useSidebar();
  const navigate = useNavigate();

  // State management
  const [currentSection, setCurrentSection] = useState<ProfileSection>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nickname: user?.nickname || '',
    preferredName: user?.preferredName || '',
    bio: user?.bio || '',
    job_title: user?.job_title || JobTitle.Other,
    focus: user?.focus || Focus.PersonalDevelopment,
    location: user?.location || '',
    website: user?.website || '',
    company: user?.company || '',
    phone: user?.phone || '',
    timezone: user?.timezone || '',
    aiPreferences: user?.aiPreferences || '',
    communicationStyle: user?.communicationStyle || 'detailed',
  });

  // Avatar handling
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived values
  const displayName = formData.nickname || user?.nickname || 'ATMO User';
  const email = user?.email || 'demo@example.com';
  const userInitial = displayName.charAt(0).toUpperCase();
  const avatarUrl = avatarPreview || user?.avatar_url;

  // Handle form changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select a valid image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please select an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
      toast({
        title: 'Image Selected',
        description: 'Your new profile picture has been loaded.',
      });
    };
    reader.readAsDataURL(file);
  };

  // Save changes
  const handleSave = async () => {
    setIsLoading(true);
    try {
      let avatar_url = user?.avatar_url;

      // If there's a new avatar file, use the preview (base64 string)
      if (avatarFile && avatarPreview) {
        avatar_url = avatarPreview;
      }

      // Validate required fields
      if (!formData.nickname.trim()) {
        throw new Error('Name is required');
      }

      await updateUserProfile({
        nickname: formData.nickname.trim(),
        preferredName: formData.preferredName?.trim() || '',
        bio: formData.bio?.trim() || '',
        job_title: formData.job_title,
        focus: formData.focus,
        location: formData.location?.trim() || '',
        website: formData.website?.trim() || '',
        company: formData.company?.trim() || '',
        phone: formData.phone?.trim() || '',
        timezone: formData.timezone?.trim() || '',
        aiPreferences: formData.aiPreferences?.trim() || '',
        communicationStyle: formData.communicationStyle,
        avatar_url,
      });

      // Clear the temporary file state after successful save
      setAvatarFile(null);
      setAvatarPreview(null);

      toast({
        title: '✅ Profile Updated',
        description: 'Your ATMO profile has been saved successfully!',
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save your profile. Please try again.';
      toast({
        title: '❌ Update Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  // Sidebar navigation items
  const navigationItems = [
    { id: 'profile' as ProfileSection, label: 'Profile', icon: User },
    { id: 'professional' as ProfileSection, label: 'Professional', icon: Briefcase },
    { id: 'personal' as ProfileSection, label: 'Personal', icon: Heart },
    { id: 'preferences' as ProfileSection, label: 'Preferences', icon: Settings },
    { id: 'account' as ProfileSection, label: 'Account', icon: Shield },
  ];

  // Render current section content
  const renderSectionContent = () => {
    switch (currentSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-white mb-2">Profile</h2>
              <p className="text-white/60 text-sm">Manage your personal information</p>
            </div>

            {/* Avatar Section */}
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="relative">
                <Avatar className="w-16 h-16 border border-white/20">
                  {avatarUrl ? (
                    <AvatarImage
                      src={avatarUrl}
                      alt={displayName}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <AvatarFallback className="text-white text-lg bg-orange-500/20">
                      {userInitial}
                    </AvatarFallback>
                  )}
                </Avatar>
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 rounded-full h-8 w-8 p-0 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30"
                >
                  <Camera className="w-3 h-3" />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <h3 className="text-white font-medium">{displayName}</h3>
                <p className="text-white/60 text-sm">{email}</p>
              </div>
            </div>

            {/* Name Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">Full Name</label>
                <Input
                  value={formData.nickname}
                  onChange={(e) => handleInputChange('nickname', e.target.value)}
                  className="bg-white/5 border-white/10 text-white focus:border-orange-500/50 focus:ring-orange-500/20"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">Preferred Name</label>
                <Input
                  value={formData.preferredName}
                  onChange={(e) => handleInputChange('preferredName', e.target.value)}
                  className="bg-white/5 border-white/10 text-white focus:border-orange-500/50 focus:ring-orange-500/20"
                  placeholder="How ATMO should address you"
                />
              </div>
            </div>
          </div>
        );

      case 'professional':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-white mb-2">Professional</h2>
              <p className="text-white/60 text-sm">Your work information</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">Job Title</label>
                <Select
                  value={formData.job_title}
                  onValueChange={(value) => handleInputChange('job_title', value)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-orange-500/50 focus:ring-orange-500/20">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(JobTitle).map((title) => (
                      <SelectItem key={title} value={title}>{title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">Focus Area</label>
                <Select
                  value={formData.focus}
                  onValueChange={(value) => handleInputChange('focus', value)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-orange-500/50 focus:ring-orange-500/20">
                    <SelectValue placeholder="Primary focus" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Focus).map((focus) => (
                      <SelectItem key={focus} value={focus}>{focus}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">Company</label>
                <Input
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="bg-white/5 border-white/10 text-white focus:border-orange-500/50 focus:ring-orange-500/20"
                  placeholder="Your company"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">Location</label>
                <Input
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="bg-white/5 border-white/10 text-white focus:border-orange-500/50 focus:ring-orange-500/20"
                  placeholder="City, Country"
                />
              </div>
            </div>
          </div>
        );

      case 'personal':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-white mb-2">Personal</h2>
              <p className="text-white/60 text-sm">Additional personal information</p>
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">Bio</label>
              <TextArea
                value={formData.bio}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    handleInputChange('bio', e.target.value);
                  }
                }}
                className="bg-white/5 border-white/10 text-white focus:border-orange-500/50 focus:ring-orange-500/20 resize-none"
                placeholder="Tell us about yourself..."
                rows={4}
              />
              <p className="text-xs text-white/40 mt-1">{formData.bio.length}/500</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 text-sm mb-2">Website</label>
                <Input
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="bg-white/5 border-white/10 text-white focus:border-orange-500/50 focus:ring-orange-500/20"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm mb-2">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="bg-white/5 border-white/10 text-white focus:border-orange-500/50 focus:ring-orange-500/20"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">Timezone</label>
              <Input
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-orange-500/50 focus:ring-orange-500/20"
                placeholder="GMT-8 (Pacific Time)"
              />
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-white mb-2">Preferences</h2>
              <p className="text-white/60 text-sm">Customize your ATMO experience</p>
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">AI Context</label>
              <TextArea
                value={formData.aiPreferences}
                onChange={(e) => handleInputChange('aiPreferences', e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-orange-500/50 focus:ring-orange-500/20 resize-none"
                placeholder="Tell ATMO about your preferences, work context, or specific needs..."
                rows={4}
              />
            </div>

            <div>
              <label className="block text-white/80 text-sm mb-2">Communication Style</label>
              <Select
                value={formData.communicationStyle}
                onValueChange={(value) => handleInputChange('communicationStyle', value)}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-orange-500/50 focus:ring-orange-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concise">Concise & Direct</SelectItem>
                  <SelectItem value="detailed">Detailed & Thorough</SelectItem>
                  <SelectItem value="friendly">Friendly & Casual</SelectItem>
                  <SelectItem value="professional">Professional & Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-white mb-2">Account</h2>
              <p className="text-white/60 text-sm">Manage your account settings</p>
            </div>

            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium text-sm">Sign Out</div>
                  <div className="text-white/60 text-xs">Sign out from your ATMO account</div>
                </div>
                <Button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  {isSigningOut ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing out...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
      {/* Background effects - same as dashboard */}
      <div className="absolute inset-0 bg-[url('/bg-grid.svg')] bg-fixed opacity-[0.01] pointer-events-none" />

      {/* Adaptive container based on actual sidebar state */}
      <div
        className="min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="flex min-h-screen">
          {/* Profile Sidebar - Adaptive to NavSidebar */}
          <div
            className="hidden lg:block w-64 border-r border-white/10 bg-slate-900/50 backdrop-blur-sm fixed top-0 h-full z-30 transition-all duration-300"
            style={{ left: sidebarWidth }}
          >
            <div className="p-6">
              <h1 className="text-lg font-medium text-white mb-6">Settings</h1>
              <nav className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentSection(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                        isActive
                          ? 'bg-white/10 text-white border-l-2 border-orange-500'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div
            className="lg:hidden fixed top-0 right-0 bg-slate-900/80 backdrop-blur-sm border-b border-white/10 z-40 p-4 transition-all duration-300"
            style={{ left: sidebarWidth }}
          >
            <h1 className="text-lg font-medium text-white mb-4">Settings</h1>
            <div className="flex gap-2 overflow-x-auto">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentSection(item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 lg:p-8 lg:ml-64 pt-20 lg:pt-8">
            <div className="max-w-2xl mx-auto">
              <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-lg p-6 mb-6">
                {renderSectionContent()}
              </div>

              {/* Save Button */}
              {currentSection !== 'account' && (
                <div className="flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 px-6"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;