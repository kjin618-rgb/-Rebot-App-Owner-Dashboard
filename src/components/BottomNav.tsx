import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Sparkles, Settings } from 'lucide-react';

export default function BottomNav() {
  const { store_code = 'demo' } = useParams();

  const navItems = [
    { name: '홈', path: `/dashboard/${store_code}`, icon: LayoutDashboard },
    { name: '고객', path: `/customers/${store_code}`, icon: Users },
    { name: '메시지', path: `/messages/${store_code}`, icon: MessageSquare },
    { name: '콘텐츠', path: `/content/${store_code}`, icon: Sparkles },
    { name: '설정', path: `/settings/${store_code}`, icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-t border-stone-200/50 flex items-center justify-around px-3 z-50 shadow-[0_-4px_16px_rgba(139,115,85,0.06)] pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full py-1.5 gap-1 select-none transition-all duration-300 relative ${
                isActive
                  ? 'text-brand-800 font-bold'
                  : 'text-stone-400 hover:text-stone-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-brand-50 text-brand-700' : 'bg-transparent text-stone-400'}`}>
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                </div>
                <span className="text-[9px] font-semibold tracking-wider">{item.name}</span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-600 animate-pulse" />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
