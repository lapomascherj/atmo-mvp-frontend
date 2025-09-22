import React, {useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {Brain, Calendar, ChevronLeft, ChevronRight, LayoutDashboard, LogOut, FileText} from 'lucide-react';
import {useAuth} from '@/hooks/useMockAuth';
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
    return (
        <Link
            to={to}
            className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative',
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
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isHovering, setIsHovering] = useState(false);
    const location = useLocation();
    const {user, signOut} = useAuth();

    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    const navItems = [
        {icon: <LayoutDashboard size={20}/>, label: 'Dashboard', to: '/'},
        {icon: <Brain size={20}/>, label: 'Digital Brain', to: '/knowledge-organiser'},
        {icon: <FileText size={20}/>, label: 'New Page', to: '/new-page'},
        {icon: <Calendar size={20}/>, label: 'Calendar', to: '/calendar'},
    ];

    const userInitial = user?.nickname
        ? user.nickname.charAt(0)
        : user?.email?.charAt(0) || 'A';

    const userName = user?.nickname || user?.email?.split('@')[0] || 'User';
    const avatarUrl = user?.avatar_url || null;

    // Handle hover expansion
    const handleMouseEnter = () => {
        setIsHovering(true);
        if (isCollapsed) {
            setIsCollapsed(false);
        }
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
        if (!isCollapsed && isHovering) {
            setIsCollapsed(true);
        }
    };

    return (
        <aside
            className={cn(
                'h-screen flex flex-col bg-gradient-to-b from-[#101040]/60 to-[#010024]/80 backdrop-blur-lg border-r border-white/5 transition-all duration-300 ease-in-out fixed left-0 top-0 z-40',
                isCollapsed ? 'w-[70px]' : 'w-[220px]'
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Blur background effect */}
            <div className="absolute inset-0 bg-blue-900/10 backdrop-blur-md -z-10"></div>

            {/* Collapse toggle button */}
            <button
                onClick={toggleCollapse}
                className="absolute -right-3 top-20 bg-[#010024]/50 border border-white/10 rounded-full p-1 text-[#E3E3E3]/50 hover:text-[#E3E3E3] transition-colors z-10 h-6 w-6 flex items-center justify-center shadow-md"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
            </button>

            {/* Logo */}
            <div className={cn(
                'flex items-center px-4 h-16 border-b border-white/5',
                isCollapsed ? 'justify-center' : 'justify-start'
            )}>
                <div className="flex items-center">
                    <div
                        className="w-9 h-9 bg-[#010024] border border-[#4169E1]/20 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(65,105,225,0.3)]">
                        <span className="text-[#4169E1] text-lg font-bold">A</span>
                    </div>
                    {!isCollapsed && (
                        <span className="text-[#E3E3E3] text-lg ml-2 font-light">ATMO</span>
                    )}
                </div>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 overflow-y-auto px-3 py-6 flex flex-col gap-2 scrollbar-hide">
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
                'px-3 py-4 border-t border-white/5 space-y-2',
                isCollapsed ? 'flex flex-col items-center' : ''
            )}>
                {/* Profile Link */}
                <Link
                    to="/profile"
                    className={cn(
                        'flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-[#010024]/40 transition-all group relative',
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
                        'flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-red-500/10 transition-all text-[#E3E3E3]/70 hover:text-red-400 group relative',
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
