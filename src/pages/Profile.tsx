import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit3, Check, X, LogOut, Camera, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useMockAuth';
import { useToast } from '@/hooks/useToast';
import { AtmoCard } from '@/components/molecules/AtmoCard';
import { Button } from '@/components/atoms/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/Avatar';
import { Input } from '@/components/atoms/Input';
import { TextArea } from '@/components/atoms/TextArea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/Select';
import { JobTitle } from '@/models/JobTitle';
import { Focus } from '@/models/Focus';

const Profile: React.FC = () => {
  const { user, updateUserProfile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Check if there are unsaved changes
  const hasUnsavedChanges = isEditing && (
    formData.nickname !== (user?.nickname || '') ||
    formData.bio !== (user?.bio || '') ||
    formData.job_title !== (user?.job_title || JobTitle.Other) ||
    formData.focus !== (user?.focus || Focus.PersonalDevelopment) ||
    formData.location !== (user?.location || '') ||
    formData.website !== (user?.website || '') ||
    avatarPreview !== null
  );

  // Form state
  const [formData, setFormData] = useState({
    nickname: user?.nickname || '',
    bio: user?.bio || '',
    job_title: user?.job_title || JobTitle.Other,
    focus: user?.focus || Focus.PersonalDevelopment,
    location: user?.location || '',
    website: user?.website || '',
  });

  // Avatar handling
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived values
  const displayName = isEditing ? formData.nickname : (user?.nickname || 'ATMO User');
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

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Form validation
  const validateForm = () => {
    if (!formData.nickname.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name is required.',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  // Save changes
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      let avatar_url = user?.avatar_url;
      if (avatarFile && avatarPreview) {
        avatar_url = avatarPreview;
      }

      await updateUserProfile({
        nickname: formData.nickname,
        bio: formData.bio,
        job_title: formData.job_title,
        focus: formData.focus,
        location: formData.location,
        website: formData.website,
        avatar_url,
      });

      setAvatarFile(null);
      setAvatarPreview(null);
      setIsEditing(false);

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to save your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setFormData({
      nickname: user?.nickname || '',
      bio: user?.bio || '',
      job_title: user?.job_title || JobTitle.Other,
      focus: user?.focus || Focus.PersonalDevelopment,
      location: user?.location || '',
      website: user?.website || '',
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsEditing(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[url('/bg-grid.svg')] bg-fixed opacity-[0.01] pointer-events-none" />
      <div className="fixed top-[20%] right-[25%] -z-10 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px] animate-pulse-soft" />
      <div className="fixed top-[60%] left-[15%] -z-10 w-96 h-96 bg-orange-500/3 rounded-full blur-[120px] animate-pulse-soft" />

      {/* Main content */}
      <div className="container mx-auto px-6 py-16 max-w-2xl ml-[200px] lg:ml-[200px] xl:ml-auto 2xl:ml-auto">

        {/* Profile Hero */}
        <div className="text-center mb-16">
          <div className="relative inline-block mb-8">
            {/* Avatar */}
            <Avatar className="w-32 h-32 mx-auto border-4 border-white/10">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
              ) : (
                <AvatarFallback className="text-white text-4xl font-light bg-gradient-to-br from-orange-500/20 to-orange-600/20">
                  {userInitial}
                </AvatarFallback>
              )}
            </Avatar>

            {/* Avatar edit button */}
            {isEditing && (
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 rounded-full h-10 w-10 p-0 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30"
              >
                <Camera className="w-4 h-4" />
              </Button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Name */}
          <div className="mb-2">
            {isEditing ? (
              <Input
                value={formData.nickname}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
                className="text-center text-4xl font-light bg-transparent border-none text-white placeholder:text-white/40 focus:ring-orange-500/30 focus:border-orange-500/30 mb-2"
                placeholder="Your name"
              />
            ) : (
              <h1 className="text-4xl font-light text-white mb-2">{displayName}</h1>
            )}
          </div>

          {/* Email */}
          <p className="text-white/60 text-lg">{email}</p>
        </div>

        {/* Main Profile Card */}
        <AtmoCard variant="orange" className="p-8 mb-8">
          <div className="space-y-8">

            {/* Professional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-3">Job Title</label>
                {isEditing ? (
                  <Select
                    value={formData.job_title}
                    onValueChange={(value) => handleInputChange('job_title', value)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-orange-500/50 focus:ring-orange-500/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(JobTitle).map((title) => (
                        <SelectItem key={title} value={title}>{title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-white/90 py-3">{formData.job_title}</p>
                )}
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-3">Focus Area</label>
                {isEditing ? (
                  <Select
                    value={formData.focus}
                    onValueChange={(value) => handleInputChange('focus', value)}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-orange-500/50 focus:ring-orange-500/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Focus).map((focus) => (
                        <SelectItem key={focus} value={focus}>{focus}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-white/90 py-3">{formData.focus}</p>
                )}
              </div>
            </div>

            {/* Location and Website */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-3">Location</label>
                {isEditing ? (
                  <Input
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-orange-500/50 focus:ring-orange-500/20"
                    placeholder="City, Country"
                  />
                ) : (
                  <p className="text-white/90 py-3">
                    {formData.location || <span className="text-white/40">Not specified</span>}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-3">Website</label>
                {isEditing ? (
                  <Input
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-orange-500/50 focus:ring-orange-500/20"
                    placeholder="https://example.com"
                  />
                ) : (
                  <p className="text-white/90 py-3">
                    {formData.website ? (
                      <a
                        href={formData.website.startsWith('http') ? formData.website : `https://${formData.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        {formData.website}
                      </a>
                    ) : (
                      <span className="text-white/40">Not specified</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-white/80 text-sm font-medium">Bio</label>
                {isEditing && (
                  <span className="text-xs text-white/40">
                    {formData.bio.length}/500
                  </span>
                )}
              </div>
              {isEditing ? (
                <TextArea
                  value={formData.bio}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      handleInputChange('bio', e.target.value);
                    }
                  }}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-orange-500/50 focus:ring-orange-500/20 resize-none"
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              ) : (
                <p className="text-white/90 py-3 min-h-[80px] leading-relaxed">
                  {formData.bio || <span className="text-white/40">No bio added yet</span>}
                </p>
              )}
            </div>
          </div>
        </AtmoCard>

        {/* Actions */}
        <div className="flex items-center justify-between">
          {/* Edit/Save Actions */}
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  disabled={isLoading || !hasUnsavedChanges}
                  className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 px-6 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="ghost"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 px-6"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>

          {/* Sign Out */}
          <Button
            onClick={handleSignOut}
            disabled={isSigningOut}
            variant="ghost"
            className="text-white/60 hover:text-red-400 hover:bg-red-500/10"
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
};

export default Profile;