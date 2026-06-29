import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Sparkles, Settings, Coffee } from 'lucide-react';

interface SidebarProps {
  storeName?: string;
}

export default function Sidebar({ storeName = '리봇 베이커리' }: SidebarProps) {
  const { store_code = 'demo' } = useParams();

  const navItems = [
    { name: '홈', path: `/dashboard/${store_code}`, icon: LayoutDashboard },
    { name: '고객 관리', path: `/customers/${store_code}`, icon: Users },
    { name: '메시지 발송', path: `/messages/${store_code}`, icon: MessageSquare },
    { name: '콘텐츠 생성', path: `/content/${store_code}`, icon: Sparkles },
    { name: '설정', path: `/settings/${store_code}`, icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-[240px] h-screen bg-white border-r border-stone-200 sticky top-0 shrink-0">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-6 gap-2.5 border-b border-stone-100">
        <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center shadow-sm">
          <Coffee className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-stone-900 leading-none text-base">리봇 CRM</h1>
          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full mt-1 inline-block">
            {storeName}
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-50 text-amber-800 font-semibold'
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-stone-100">
        <div className="bg-stone-50 rounded-xl p-3 text-center">
          <p className="text-[11px] text-stone-400 font-mono">WORKSPACE ID</p>
          <p className="text-xs text-stone-600 font-medium font-mono mt-0.5 truncate" title={store_code}>
            {store_code}
          </p>
        </div>
      </div>
    </aside>
  );
}
