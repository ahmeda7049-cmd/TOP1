import React, { useState, useRef, useEffect } from 'react';
import { Bell, BookOpen, HelpCircle, User, Home, Users } from 'lucide-react';
import { AppNotification, TabId } from '../types';

interface TopBarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  avatarEmoji: string;
  points: number;
  notifications: AppNotification[];
  readNotificationIds: string[];
  onMarkNotificationRead: (id: string) => void;
  onNotificationNavigate: (notification: AppNotification) => void;
  onStartFeaturedQuiz: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  avatarEmoji,
  points,
  notifications,
  readNotificationIds,
  onMarkNotificationRead,
  onNotificationNavigate,
  onStartFeaturedQuiz,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !readNotificationIds.includes(n.id)).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'الرئيسية', icon: <Home className="w-4 h-4" /> },
    { id: 'lessons', label: 'الدروس', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'quizzes', label: 'الاختبارات', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'friends', label: 'الأصدقاء', icon: <Users className="w-4 h-4" /> },
    { id: 'profile', label: 'حسابي', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Mobile Header (< lg) matching TOP1 gradient capsule */}
      <header className="lg:hidden sticky top-0 z-30 px-3 pt-2 pb-1 bg-[#FFF9FA]/95 backdrop-blur-md">
        <div
          className="rounded-[28px] px-4 py-2.5 flex items-center justify-between text-white shadow-sm"
          style={{ background: 'linear-gradient(90deg, #0F172A, #FF5A7A)' }}
        >
          <button
            type="button"
            onClick={() => onSelectTab('quizzes')}
            aria-label="الاختبارات والتحديات"
            className="w-11 h-11 rounded-full flex items-center justify-center text-xl hover:bg-white/15 transition-colors focus-visible:outline-2 focus-visible:outline-white"
          >
            <span aria-hidden="true">🏆</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="text-center focus-visible:outline-2 focus-visible:outline-white rounded-xl px-2"
          >
            <div
              dir="ltr"
              className="font-display text-[30px] font-black tracking-wider leading-none inline-flex items-baseline"
            >
              TOP<span className="text-[#FFD93D] text-[36px] leading-none">1</span>
            </div>
            <div className="text-[11px] text-white/85 font-medium leading-tight mt-0.5">
              رقم 1 في أولى ثانوي
            </div>
          </button>

          <div className="flex items-center gap-0.5" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((prev) => !prev)}
              aria-label="الإشعارات"
              className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/15 transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[15px] h-3.5 px-1 rounded-full bg-[#FFD93D] text-[#0F172A] text-[9px] font-black flex items-center justify-center tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('profile')}
              aria-label="حسابي"
              className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-xl hover:bg-white/25 transition-colors"
            >
              <span aria-hidden="true">{avatarEmoji}</span>
            </button>
          </div>
        </div>

        {/* Mobile Notifications Dropdown */}
        {notifOpen && (
          <div className="mt-2 bg-white rounded-2xl shadow-lg border border-slate-200/80 p-3 z-40">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="font-display font-bold text-sm text-[#0F172A]">التنبيهات الدراسية</span>
              <button
                type="button"
                onClick={() => setNotifOpen(false)}
                className="text-xs text-slate-500 hover:text-[#0F172A] px-2 py-1"
              >
                إغلاق
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {notifications.map((n) => {
                const isRead = readNotificationIds.includes(n.id);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      onMarkNotificationRead(n.id);
                      onNotificationNavigate(n);
                      setNotifOpen(false);
                    }}
                    className={`w-full text-right p-2.5 rounded-xl transition-colors flex flex-col gap-1 ${
                      isRead ? 'bg-slate-50 text-slate-600' : 'bg-[#FFF3F6] text-[#0F172A]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-bold text-sm">{n.title}</span>
                      <span className="text-[11px] text-slate-500 shrink-0">{n.timeLabel}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.body}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Desktop Top Navigation Bar (lg:) - clean 3-zone contract */}
      <header
        className="hidden lg:block sticky top-0 z-30 text-white shadow-sm"
        style={{ background: 'linear-gradient(90deg, #0F172A 0%, #1E293B 55%, #FF5A7A 100%)' }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Title */}
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="whitespace-nowrap shrink-0 flex items-baseline gap-2.5 focus-visible:outline-2 focus-visible:outline-white rounded-lg px-1"
          >
            <span
              dir="ltr"
              className="font-display text-[28px] font-black tracking-wider leading-none inline-flex items-baseline"
            >
              TOP<span className="text-[#FFD93D] text-[34px] leading-none">1</span>
            </span>
          </button>

          {/* Zone 2: 4 Single-Line Nav Links */}
          <nav className="flex items-center gap-7" aria-label="التنقل الرئيسي">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`whitespace-nowrap shrink-0 text-sm font-display font-bold py-1.5 border-b-2 transition-colors ${
                    isActive
                      ? 'text-[#FFD93D] border-[#FFD93D]'
                      : 'text-white/85 border-transparent hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary CTA + Notifications */}
          <div className="flex items-center gap-3 shrink-0 relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((prev) => !prev)}
              aria-label="الإشعارات"
              className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/15 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#FFD93D] text-[#0F172A] text-[10px] font-black flex items-center justify-center tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onStartFeaturedQuiz}
              className="whitespace-nowrap shrink-0 px-4 py-2 rounded-full text-sm font-display font-black bg-[#FFD93D] text-[#0F172A] shadow-sm hover:brightness-95 active:scale-[0.98] transition-all"
            >
              ابدأ الاختبار
            </button>

            {notifOpen && (
              <div className="hidden lg:block absolute left-0 top-12 w-80 bg-white text-[#0F172A] rounded-2xl shadow-xl border border-slate-200/80 p-3 z-50">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span className="font-display font-bold text-sm">التنبيهات الدراسية</span>
                  <span className="text-xs text-slate-500 tabular-nums">{points} نقطة</span>
                </div>
                <div className="space-y-2">
                  {notifications.map((n) => {
                    const isRead = readNotificationIds.includes(n.id);
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          onMarkNotificationRead(n.id);
                          onNotificationNavigate(n);
                          setNotifOpen(false);
                        }}
                        className={`w-full text-right p-2.5 rounded-xl transition-colors flex flex-col gap-1 ${
                          isRead ? 'bg-slate-50 text-slate-600' : 'bg-[#FFF3F6] text-[#0F172A] hover:bg-[#FFE6EC]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display font-bold text-xs">{n.title}</span>
                          <span className="text-[11px] text-slate-500 shrink-0">{n.timeLabel}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{n.body}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
