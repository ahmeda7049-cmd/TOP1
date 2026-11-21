import React from 'react';
import { Home, BookOpen, HelpCircle, Users, User } from 'lucide-react';
import { TabId } from '../types';

interface BottomNavProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'الرئيسية', icon: <Home className="w-5 h-5" /> },
    { id: 'lessons', label: 'الدروس', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'quizzes', label: 'الاختبارات', icon: <HelpCircle className="w-5 h-5" /> },
    { id: 'friends', label: 'الأصدقاء', icon: <Users className="w-5 h-5" /> },
    { id: 'profile', label: 'حسابي', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <nav
      aria-label="شريط التنقل السفلي"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-1.5 py-1.5"
    >
      <div className="grid grid-cols-5 items-center max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-[#FF5A7A] ${
                isActive ? 'text-[#FF5A7A] font-black' : 'text-slate-500 hover:text-[#0F172A] font-medium'
              }`}
            >
              <span className={isActive ? 'scale-110 transition-transform' : ''}>{tab.icon}</span>
              <span className="text-[11px] font-display whitespace-nowrap leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
