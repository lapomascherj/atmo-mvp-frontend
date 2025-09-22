import React from 'react';
import { Home, Calendar, Settings, FileText, ListTodo } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const AppSidebar = () => {
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: FileText, label: 'Daily Road', path: '/daily-road' },
    { icon: ListTodo, label: 'Long Term Goals', path: '/long-term-goal' },
    { icon: Settings, label: 'Tools', path: '/tools' },
    { icon: Calendar, label: 'Calendar', path: '#' }
  ];

  return (
    <div className="h-full bg-black/50 backdrop-blur-xl fixed left-0 top-0 bottom-0 w-[64px] flex flex-col items-center py-4 border-r border-white/5 z-50 shadow-xl">
      <div className="w-full flex flex-col items-center gap-1">
        {/* Enhanced logo with glow effect */}
        <div className="w-10 h-10 rounded-md mb-8 flex items-center justify-center overflow-hidden">
          <div className="w-full h-full bg-[#FF5F1F] flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
        </div>

        {/* Enhanced navigation items */}
        <nav className="flex flex-col items-center gap-4 w-full">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                className={`relative w-full flex justify-center py-3 group transition-all duration-300`}
              >
                <div
                  className={`absolute left-0 w-1 h-full rounded-r-md transition-all ${
                    isActive 
                      ? 'bg-[#FF5F1F]' 
                      : 'bg-transparent group-hover:bg-white/20'
                  }`}
                />
                <div className={`p-2 rounded-md transition-all ${
                  isActive 
                    ? 'text-[#FF5F1F]'
                    : 'text-white/70 group-hover:text-white'
                  } group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className={`w-5 h-5 ${isActive ? 'filter drop-shadow-[0_0_3px_rgba(255,95,31,0.8)]' : ''}`} />
                  <span className="sr-only">{item.label}</span>
                </div>

                {/* Tooltip for sidebar items */}
                <div className={`absolute left-16 px-2 py-1 bg-black/80 backdrop-blur-md rounded text-xs text-white border border-white/10 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300`}>
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AppSidebar;
