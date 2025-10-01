import React from 'react';
import {Link, useLocation} from 'react-router-dom';
import {Brain, ChevronLeft, ChevronRight, LayoutDashboard, LogOut} from 'lucide-react';
import {useAuth} from '@/hooks/useMockAuth';
import {useSidebar} from '@/context/SidebarContext';
import {cn} from '@/utils/utils.ts';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/atoms/Avatar.tsx';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    to: string;
    isActive: boolean;
    isCollapsed: boolean;
}

const NavItem = ({icon, label, to, isActive, isCollapsed}: NavItemProps) => {
    const handleClick = (e: React.MouseEvent) => {
        console.log('NavItem clicked:', { label, to, isActive });
        // Let the Link handle navigation normally
    };

    return (
        <Link
            to={to}
            onClick={handleClick}
            className={cn(
                'flex items-center gap-2 px-2 py-2 rounded-lg transition-all duration-300 group relative cursor-pointer',
                isCollapsed ? 'justify-center' : '',
                isActive
                    ? 'bg-[#010024]/60 text-[#E3E3E3] shadow-inner shadow-white/5'
                    : 'text-[#E3E3E3]/70 hover:text-[#E3E3E3] hover:bg-[#010024]/40'
            )}
        >
    <span className={cn(
        'relative p-1',
        isActive ? 'text-[#4169E1]' : 'text-[#E3E3E3]/70'
    )}>
      {icon}
        {isActive && (
            <span className="absolute inset-0 rounded-full animate-pulse-soft bg-[#4169E1]/20 blur-sm"></span>
        )}
    </span>

            {!isCollapsed && (
                <span className="font-medium text-xs truncate">{label}</span>
            )}

            {isCollapsed && (
                <div
                    className="absolute left-full ml-2 py-1 px-2 bg-[#010024]/80 text-[#E3E3E3] text-[10px] rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    {label}
                </div>
            )}
        </Link>
    )
};

const NavSidebar: React.FC = () => {
    const {isCollapsed, toggleCollapse} = useSidebar();
    const location = useLocation();
    const {user, signOut} = useAuth();

    const navItems = [
        {icon: <LayoutDashboard size={20}/>, label: 'Dashboard', to: '/'},
        {icon: <Brain size={20}/>, label: 'Digital Brain', to: '/digital-brain'},
    ];

    const userInitial = user?.nickname
        ? user.nickname.charAt(0)
        : user?.email?.charAt(0) || 'A';

    const userName = user?.nickname || user?.email?.split('@')[0] || 'User';
    const avatarUrl = user?.avatar_url || null;

    return (
        <aside
            className={cn(
                'h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-r border-white/5 fixed left-0 top-0 z-40',
                isCollapsed ? 'w-[60px]' : 'w-[180px]'
            )}
            style={{
                transition: 'width 300ms ease-in-out',
                willChange: 'width',
            }}
        >
            {/* Collapse toggle button - Outside sidebar */}
            <button
                onClick={toggleCollapse}
                className="absolute -right-3 top-20 bg-slate-900 border border-white/10 rounded-full p-1 text-white/50 hover:text-white transition-colors z-50 h-6 w-6 flex items-center justify-center shadow-lg"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
            </button>

            {/* Logo */}
            <div className={cn(
                'flex items-center px-3 h-14 border-b border-white/5',
                isCollapsed ? 'justify-center' : 'justify-start'
            )}>
                <div className="flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <img src="/AtmoPNG.png" alt="Atmo" className="w-full h-full object-contain" />
                    </div>
                    {!isCollapsed && (
                        <span className="text-[#E3E3E3] text-base ml-2 font-light">ATMO</span>
                    )}
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto px-2 py-4 flex flex-col gap-1 scrollbar-hide">
                {navItems.map((item) => (
                    <NavItem
                        key={item.to}
                        icon={item.icon}
                        label={item.label}
                        to={item.to}
                        isActive={location.pathname === item.to}
                        isCollapsed={isCollapsed}
                    />
                ))}
            </nav>

            {/* Bottom section: Profile and Sign Out */}
            <div className={cn(
                'px-2 py-3 border-t border-white/5 space-y-1',
                isCollapsed ? 'flex flex-col items-center' : ''
            )}>
                {/* Profile Link */}
                <Link
                    to="/profile"
                    className={cn(
                        'flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[#010024]/40 transition-all group relative',
                        location.pathname === '/profile' ? 'bg-[#010024]/60 shadow-inner shadow-white/5' : '',
                        isCollapsed ? 'justify-center w-full' : ''
                    )}
                >
                    <Avatar className="w-8 h-8 rounded-full border border-[#4169E1]/20 bg-[#010024]">
                        {avatarUrl ? (
                            <AvatarImage src={avatarUrl} alt={userName} className="object-cover"/>
                        ) : (
                            <AvatarFallback
                                className="text-[#4169E1] text-sm font-medium">{userInitial}</AvatarFallback>
                        )}
                    </Avatar>
                    {!isCollapsed && (
                        <div className="overflow-hidden flex-1">
                            <p className="text-[#E3E3E3] text-xs truncate max-w-[130px]">
                                {userName}
                            </p>
                            <p className="text-[#E3E3E3]/50 text-[10px]">
                                Free Plan
                            </p>
                        </div>
                    )}
                    {isCollapsed && (
                        <div
                            className="absolute left-full ml-2 py-1 px-2 bg-[#010024]/80 text-[#E3E3E3] text-[10px] rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                            Profile Settings
                        </div>
                    )}
                </Link>

                {/* Sign Out Button */}
                <button
                    onClick={signOut}
                    className={cn(
                        'flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-red-500/10 transition-all text-[#E3E3E3]/70 hover:text-red-400 group relative',
                        isCollapsed ? 'justify-center w-full' : ''
                    )}
                >
                    <LogOut size={16} />
                    {!isCollapsed && (
                        <span className="text-xs">Sign Out</span>
                    )}
                    {isCollapsed && (
                        <div
                            className="absolute left-full ml-2 py-1 px-2 bg-[#010024]/80 text-[#E3E3E3] text-[10px] rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                            Sign Out
                        </div>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default NavSidebar;
