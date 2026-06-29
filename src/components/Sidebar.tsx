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
    <aside className="hidden md:flex flex-col w-[260px] h-screen bg-white border-r border-stone-200/60 sticky top-0 shrink-0 shadow-[1px_0_10px_rgba(139,115,85,0.02)]">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-stone-100">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center shadow-md shadow-brand-500/20">
          <Coffee className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-stone-900 tracking-tight text-sm leading-none flex items-center gap-1.5">
            리봇 CRM
            <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded-md border border-brand-100">AI</span>
          </h1>
          <p className="text-[11px] text-stone-400 font-medium truncate mt-1" title={storeName}>
            {storeName}
          </p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-4.5 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 ${
                  isActive
                    ? 'bg-brand-50 text-brand-800 border-l-[3px] border-brand-600 pl-3 shadow-[0_2px_8px_-1px_rgba(181,124,76,0.06)] font-bold'
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900 border-l-[3px] border-transparent pl-3'
                }`
              }
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-stone-100/80 bg-stone-50/30">
        <div className="bg-stone-50/80 border border-stone-100 rounded-xl p-3 text-center shadow-inner">
          <p className="text-[10px] font-bold text-stone-400 tracking-wider font-mono">STORE INSTANCE</p>
          <p className="text-xs text-stone-600 font-semibold font-mono mt-0.5 truncate" title={store_code}>
            {store_code}
          </p>
        </div>
      </div>
    </aside>
  );
}
