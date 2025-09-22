import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Award,
    Calendar,
    Check,
    Cloud,
    Edit,
    FileText,
    Github,
    Loader2,
    Lock,
    LogOut,
    Search,
    Shield,
    Bot
} from 'lucide-react';
import { useAuth } from '@/hooks/useMockAuth';
import { useIntegrationsStore } from '@/stores/useMockIntegrationsStore';
import { Button } from '@/components/atoms/Button.tsx';
import { Switch } from '@/components/atoms/Switch.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/Avatar.tsx';
import { Progress } from '@/components/atoms/Progress.tsx';
import { Input } from '@/components/atoms/Input.tsx';
import { TextArea } from '@/components/atoms/TextArea.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/Select.tsx';
import IntegrationCard from '@/components/molecules/IntegrationCard';
import { useToast } from '@/hooks/useToast';
import { usePocketBase } from '@/hooks/useMockPocketBase';
import { useAuthStore } from '@/stores/useMockAuthStore';
import { digitalBrainAPI } from '@/api/mockDigitalBrainApi';
import { Persona } from '@/models/Persona';
import { JobTitle } from '@/models/JobTitle';
import { IntegrationProvider } from '@/models/IntegrationProvider';
import { Focus } from '@/models/Focus';
import { AvatarStyle } from '@/models/AvatarStyle';
import { CommunicationStyle } from '@/models/CommunicationStyle';

const Profile: React.FC = () => {
    const { user, updateUserProfile, getManagementUrl, token } = useAuth();
    const pb = usePocketBase();
    const { integrations, fetchIntegrations } = useIntegrationsStore();
    const { toast } = useToast();
    const navigate = useNavigate();


    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isDownloadingData, setIsDownloadingData] = useState(false);
    const [downloadLink, setDownloadLink] = useState<string | null>(null);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [integrationsSearch, setIntegrationsSearch] = useState('');
    const [editingField, setEditingField] = useState<'name' | null>(null);
    const [profileForm, setProfileForm] = useState({
        nickname: user?.nickname || '',
        job_title: user?.job_title || JobTitle.Other,
        focus: user?.focus || Focus.PersonalDevelopment,
        biggest_challenge: user?.biggest_challenge || '',
        avatar_style: user?.avatar_style || AvatarStyle.Balanced,
        communication_style: user?.communication_style || CommunicationStyle.Detailed,
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Use user data from auth context
    const fullName = user?.nickname || 'ATMO User';
    const email = user?.email || 'user@example.com';
    const userInitial = fullName.charAt(0).toUpperCase();
    const avatarUrl = avatarPreview || user?.avatar_url || null;

    // Update when user data changes
    useEffect(() => {
        if (user) {
            setProfileForm({
                nickname: user.nickname || '',
                job_title: user.job_title || JobTitle.Other,
                focus: user.focus || Focus.PersonalDevelopment,
                biggest_challenge: user.biggest_challenge || '',
                avatar_style: user.avatar_style || AvatarStyle.Balanced,
                communication_style: user.communication_style || CommunicationStyle.Detailed,
            });

        }
    }, [user]);

    // Handle inline name update
    const handleUpdateField = async (field: 'name', value: string) => {
        if (!user) return;

        setEditingField(null);

        try {
            await updateUserProfile({
                nickname: value,
            });
            toast({
                title: 'Name Updated',
                description: 'Your display name has been updated successfully.',
            });
        } catch (error) {
            console.error('Failed to update name:', error);
            toast({
                title: 'Update Failed',
                description: 'Failed to update display name. Please try again.',
                variant: 'destructive',
            });
        }
    };

    // Inline editing component
    const InlineTextEdit = ({ value, onSave, onCancel, placeholder = "", className = "" }: {
        value: string;
        onSave: (value: string) => void;
        onCancel: () => void;
        placeholder?: string;
        className?: string;
    }) => {
        const [editValue, setEditValue] = useState(value);

        const handleSave = () => {
            onSave(editValue);
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
            } else if (e.key === 'Escape') {
                onCancel();
            }
        };

        const handleBlur = () => {
            handleSave();
        };

        return (
            <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className={`bg-transparent border-none outline-none w-full ${className}`}
                style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    padding: 0,
                    margin: 0,
                    height: 'auto'
                }}
                placeholder={placeholder}
                autoFocus
            />
        );
    };

    // Handle profile image selection
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

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleProfileUpdate = async () => {
        setIsUpdatingProfile(true);
        try {
            let avatar_url = user?.avatar_url;

            if (avatarFile) {
                avatar_url = avatarPreview;
            }

            await updateUserProfile({
                nickname: profileForm.nickname,
                job_title: profileForm.job_title,
                avatar_url,
                focus: profileForm.focus,
                biggest_challenge: profileForm.biggest_challenge,
                avatar_style: profileForm.avatar_style,
                communication_style: profileForm.communication_style,
            });

            setAvatarFile(null);
            setAvatarPreview(null);
            
            toast({
                title: 'Profile Updated',
                description: 'Your profile has been updated successfully.',
            });
        } catch (error) {
            console.error('Profile update failed:', error);
            toast({
                title: 'Update Failed',
                description: 'Failed to update profile. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setProfileForm(prev => ({
            ...prev,
            [name]: value
        }));
    };



    const handleSignOut = async () => {
        try {
            setIsSigningOut(true);
            await signOut();
            navigate('/auth/login');
        } catch (error) {
            console.error('Error signing out:', error);
            setIsSigningOut(false);
        }
    };

    // Handle password reset through Casdoor API
    const handlePasswordReset = async () => {
        setIsResettingPassword(true);
        try {
            const { casdoorUser } = useAuthStore.getState();
            if (!casdoorUser?.email) {
                toast({
                    title: 'Email Required',
                    description: 'Email address is required for password reset.',
                    variant: 'destructive',
                });
                return;
            }

            // Call Casdoor password reset API
            const casdoorServerUrl = import.meta.env.VITE_CASDOOR_SERVER_URL || (() => {
              console.error("❌ VITE_CASDOOR_SERVER_URL environment variable is required for password reset");
              throw new Error("VITE_CASDOOR_SERVER_URL environment variable is required");
            })();
            const appName = import.meta.env.VITE_CASDOOR_APP_NAME || 'atmo';
            const organizationName = import.meta.env.VITE_CASDOOR_ORGANIZATION_NAME || 'atmo';
            
            const response = await fetch(`${casdoorServerUrl}/api/send-reset-password-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('casdoor_token')}`,
                },
                body: JSON.stringify({
                    organization: organizationName,
                    application: appName,
                    email: casdoorUser.email,
                    type: 'reset_password',
                }),
            });

            if (!response.ok) {
                throw new Error(`Password reset request failed: ${response.status}`);
            }

            toast({
                title: 'Password Reset Email Sent',
                description: 'Please check your email for password reset instructions.',
            });
        } catch (error: any) {
            console.error('Password reset error:', error);
            toast({
                title: 'Password Reset Failed',
                description: error.message || 'Failed to send password reset email. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsResettingPassword(false);
        }
    };



    // Handle data download from DigitalBrain
    const handleDataDownload = async () => {
        setIsDownloadingData(true);
        setDownloadLink(null);
        
        try {
            const result = await digitalBrainAPI.exportUserData();
            
            if (result.success && result.data.downloadUrl) {
                setDownloadLink(result.data.downloadUrl);
                toast({
                    title: 'Data Export Ready',
                    description: 'Your data export has been generated successfully. Click the download link below.',
                });
            } else {
                throw new Error(result.message || 'Failed to generate data export');
            }
        } catch (error: any) {
            console.error('Failed to download data:', error);
            toast({
                title: 'Data Export Failed',
                description: error.message || 'Failed to generate data export. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsDownloadingData(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
            {/* Simplified background effects */}
            <div
                className="absolute inset-0 bg-[url('/bg-grid.svg')] bg-fixed opacity-[0.01] pointer-events-none"></div>
            <div
                className="fixed top-[20%] right-[25%] -z-10 w-72 h-72 bg-blue-500/5 rounded-full blur-[100px] animate-pulse-soft"/>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
                {/* Center content for large screens */}
                <div className="max-w-4xl mx-auto ml-[70px] lg:ml-[70px] xl:ml-auto 2xl:ml-auto">
                {/* User Profile Header */}
                <div className="mb-12 bg-slate-800/10 rounded-2xl border border-slate-700/20 p-6">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <Avatar className="w-20 h-20 rounded-2xl bg-slate-800/30 border border-slate-700/20">
                                {avatarUrl ? (
                                    <AvatarImage src={avatarUrl} alt={fullName} className="object-cover"/>
                                ) : (
                                    <AvatarFallback
                                        className="text-white text-3xl font-medium">{userInitial}</AvatarFallback>
                                )}
                            </Avatar>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarChange}
                            />
                            <Button
                                size="sm"
                                className="absolute bottom-0 right-0 rounded-full h-7 w-7 p-0 bg-[#FF7000]/20 hover:bg-[#FF7000]/30 border border-[#FF7000]/30"
                                onClick={handleAvatarClick}
                            >
                                <Edit size={12}/>
                            </Button>
                        </div>

                        <div className="flex-1">
                            {/* Name and Sign Out Row */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="group flex-1">
                                    {editingField === 'name' ? (
                                        <InlineTextEdit
                                            value={fullName}
                                            onSave={(value) => handleUpdateField('name', value)}
                                            onCancel={() => setEditingField(null)}
                                            placeholder="Enter your display name"
                                            className="text-3xl font-light text-white"
                                        />
                                    ) : (
                                        <h1 
                                            className="text-3xl font-light text-white hover:text-[#FF7000] cursor-pointer transition-colors"
                                            onClick={() => setEditingField('name')}
                                            title="Click to edit display name"
                                        >
                                            {fullName}
                                        </h1>
                                    )}
                                </div>
                                
                                {/* Sign Out Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-slate-800/30 border-slate-700/30 text-white/70 hover:bg-slate-800/40 hover:border-red-500/30 hover:text-red-400 transition-colors"
                                    onClick={handleSignOut}
                                    disabled={isSigningOut}
                                >
                                    {isSigningOut ? (
                                        <>
                                            <Loader2 size={14} className="mr-1 animate-spin"/>
                                            <span className="text-xs">Signing out...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LogOut size={14} className="mr-1"/>
                                            <span className="text-xs">Sign Out</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                            
                            {/* Email - Read Only */}
                            <p className="text-slate-400 mb-4">{email}</p>
                            
                            {/* Improved Tier Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-sm font-medium text-slate-300">Free Plan</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 flex-1">
                                        <Progress value={30} className="flex-1 h-1.5 bg-slate-800/30"
                                                  indicatorClassName="bg-[#FF7000]"/>
                                        <span className="text-xs text-slate-400 whitespace-nowrap">30% used</span>
                                    </div>
                                    <Button size="sm"
                                            className="bg-[#FF7000]/20 hover:bg-[#FF7000]/30 text-[#FF7000] border border-[#FF7000]/30 transition-all gap-1.5">
                                        <Award size={14}/>
                                        <span className="font-medium">Upgrade</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="space-y-8">
                    {/* Account Settings and Security in Two Columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Account Settings */}
                        <section className="bg-slate-800/10 rounded-2xl border border-slate-700/20 p-6 lg:col-span-2">
                            <h2 className="text-2xl font-light text-white mb-6">Account Settings</h2>

                            <div className="space-y-6">
                                {/* Profile Information */}
                                <div className="space-y-4">
                                    {/* Job Title and Focus Area on Same Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-white/80 text-sm block mb-2">Job Title</label>
                                            <Select
                                                name="job_title"
                                                value={profileForm.job_title}
                                                onValueChange={(value) => setProfileForm(prev => ({ ...prev, job_title: value as JobTitle }))}
                                            >
                                                <SelectTrigger className="bg-slate-800/30 border-slate-700/30 text-white focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20">
                                                    <SelectValue placeholder="Select Job Title" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.values(JobTitle).map((title) => (
                                                        <SelectItem key={title} value={title}>{title}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="text-white/80 text-sm block mb-2">Focus Area</label>
                                            <Select
                                                name="focus"
                                                value={profileForm.focus}
                                                onValueChange={(value) => setProfileForm(prev => ({ ...prev, focus: value as Focus }))}
                                            >
                                                <SelectTrigger className="bg-slate-800/30 border-slate-700/30 text-white focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20">
                                                    <SelectValue placeholder="Select Focus Area" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.values(Focus).map((focus) => (
                                                        <SelectItem key={focus} value={focus}>{focus}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    
                                    {/* Biggest Challenge - Full Width */}
                                    <div>
                                        <label className="text-white/80 text-sm block mb-2">Biggest Challenge</label>
                                        <TextArea
                                            name="biggest_challenge"
                                            value={profileForm.biggest_challenge}
                                            onChange={(e) => setProfileForm(prev => ({ ...prev, biggest_challenge: e.target.value }))}
                                            className="bg-slate-800/30 border-slate-700/30 text-white focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20 min-h-[100px]"
                                            placeholder="What's your biggest challenge right now? Describe it in detail..."
                                            rows={4}
                                        />
                                    </div>
                                </div>

                                {/* Save Profile Button */}
                                <div className="flex justify-end">
                                    <Button 
                                        onClick={handleProfileUpdate} 
                                        disabled={isUpdatingProfile}
                                        className="bg-[#FF7000]/20 hover:bg-[#FF7000]/30 text-[#FF7000] border border-[#FF7000]/30 transition-all"
                                    >
                                        {isUpdatingProfile ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Check size={16} className="mr-2"/>
                                                Save Profile
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </section>

                        {/* Security & Privacy */}
                        <section className="bg-slate-800/10 rounded-2xl border border-slate-700/20 p-6">
                            <h2 className="text-2xl font-light text-white mb-6">Security & Privacy</h2>
                            
                            <div className="space-y-4">
                                <Button
                                    variant="outline"
                                    onClick={handlePasswordReset}
                                    disabled={isResettingPassword}
                                    className="w-full justify-start gap-2 bg-slate-800/30 border-slate-700/30 text-white hover:bg-slate-800/40 hover:border-[#FF7000]/30 hover:text-[#FF7000]"
                                >
                                    {isResettingPassword ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin"/>
                                            Sending Reset Email...
                                        </>
                                    ) : (
                                        <>
                                            <Lock size={16}/>
                                            Reset Password
                                        </>
                                    )}
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={handleDataDownload}
                                    disabled={isDownloadingData}
                                    className="w-full justify-start gap-2 bg-slate-800/30 border-slate-700/30 text-white hover:bg-slate-800/40 hover:border-[#FF7000]/30 hover:text-[#FF7000]"
                                >
                                    {isDownloadingData ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin"/>
                                            Preparing Download...
                                        </>
                                    ) : (
                                        <>
                                            <Cloud size={16}/>
                                            Download My Data
                                        </>
                                    )}
                                </Button>

                                {downloadLink && (
                                    <div className="p-3 rounded-xl bg-green-900/20 border border-green-500/30">
                                        <p className="text-green-400 text-sm mb-2">Your data is ready for download:</p>
                                        <a
                                            href={downloadLink}
                                            download
                                            className="text-green-300 hover:text-green-200 underline text-sm"
                                        >
                                            Download Data Archive
                                        </a>
                                    </div>
                                )}


                            </div>
                        </section>
                    </div>

                    {/* Integrations */}
                    <section className="bg-slate-800/10 rounded-2xl border border-slate-700/20 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-light text-white">Integrations</h2>
                            
                            {/* Search Bar */}
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                    placeholder="Search integrations..."
                                    value={integrationsSearch}
                                    onChange={(e) => setIntegrationsSearch(e.target.value)}
                                    className="pl-10 bg-slate-800/30 border-slate-700/30 text-white placeholder:text-slate-400 focus:border-[#FF7000]/50 focus:ring-[#FF7000]/20"
                                />
                            </div>
                        </div>

                        {/* Integration Categories in Two Columns */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Knowledge Base Integrations */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Shield className="w-5 h-5 text-blue-400" />
                                    <h3 className="text-lg font-medium text-white/90">Knowledge Base</h3>
                                </div>
                                <p className="text-sm text-slate-400 mb-6">
                                    Connect to external knowledge sources and productivity tools.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    {(['google', 'notion', 'github'] as const).filter(integration =>
                                        integration.toLowerCase().includes(integrationsSearch.toLowerCase()) ||
                                        integrationsSearch === ''
                                    ).map((integrationType) => (
                                        <IntegrationCard
                                            key={integrationType}
                                            integrationType={integrationType}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* AI Enhancer Integrations */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <Bot className="w-5 h-5 text-orange-400" />
                                    <h3 className="text-lg font-medium text-white/90">AI Enhancers</h3>
                                </div>
                                <p className="text-sm text-slate-400 mb-6">
                                    Connect AI services for content generation and analysis.
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    {(['openai'] as const).filter(integration =>
                                        integration.toLowerCase().includes(integrationsSearch.toLowerCase()) ||
                                        integrationsSearch === ''
                                    ).map((integrationType) => (
                                        <IntegrationCard
                                            key={integrationType}
                                            integrationType={integrationType}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
