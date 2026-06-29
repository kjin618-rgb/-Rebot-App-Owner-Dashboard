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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-stone-200 flex items-center justify-around px-2 z-50 shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 select-none transition-all ${
                isActive
                  ? 'text-amber-800 font-medium'
                  : 'text-stone-400 hover:text-stone-700'
              }`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] tracking-tight">{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
