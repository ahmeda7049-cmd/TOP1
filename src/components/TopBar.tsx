import React, { useState, useRef, useEffect } from 'react';
import { Bell, BookOpen, HelpCircle, User, Home, Users, Palette, Check } from 'lucide-react';
import { AppNotification, AppThemeId, TabId } from '../types';
import { APP_THEMES } from '../data/themes';

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
  currentTheme: AppThemeId;
  onSelectTheme: (theme: AppThemeId) => void;
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
  currentTheme,
  onSelectTheme,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const mobileNotifRef = useRef<HTMLDivElement>(null);
  const desktopNotifRef = useRef<HTMLDivElement>(null);
  const mobileThemeRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !readNotificationIds.includes(n.id)).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inMobileNotif = mobileNotifRef.current?.contains(target);
      const inDesktopNotif = desktopNotifRef.current?.contains(target);
      const inMobileTheme = mobileThemeRef.current?.contains(target);
      if (!inMobileNotif && !inDesktopNotif) {
        setNotifOpen(false);
      }
      if (!inMobileTheme && !inDesktopNotif) {
        setThemeOpen(false);
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
      <header className="lg:hidden sticky top-0 z-30 px-3 pt-2 pb-1 bg-canvas/95 backdrop-blur-md">
        <div
          className="rounded-[28px] px-4 py-2.5 flex items-center justify-between text-white shadow-sm"
          style={{ background: 'var(--app-header-grad)' }}
        >
          <div className="flex items-center gap-0.5" ref={mobileThemeRef}>
            <button
              type="button"
              onClick={() => onSelectTab('quizzes')}
              aria-label="الاختبارات والتحديات"
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-white/15 transition-colors focus-visible:outline-2 focus-visible:outline-white"
            >
              <span aria-hidden="true">🏆</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setThemeOpen((prev) => !prev);
                setNotifOpen(false);
              }}
              aria-label="تغيير لون التطبيق"
              className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/15 transition-colors"
            >
              <Palette className="w-4 h-4" />
            </button>
          </div>

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

          <div className="flex items-center gap-0.5" ref={mobileNotifRef}>
            <button
              type="button"
              onClick={() => {
                setNotifOpen((prev) => !prev);
                setThemeOpen(false);
              }}
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

        {/* Mobile Theme Picker Dropdown */}
        {themeOpen && (
          <div className="mt-2 bg-surface text-ink rounded-2xl shadow-lg border border-line p-3 z-40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-sm">اختر لون التطبيق</span>
              <button
                type="button"
                onClick={() => setThemeOpen(false)}
                className="text-xs text-ink-muted hover:text-ink px-2 py-1"
              >
                إغلاق
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {APP_THEMES.map((t) => {
                const isSelected = currentTheme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      onSelectTheme(t.id);
                      setThemeOpen(false);
                    }}
                    className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-display font-bold flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-ink bg-surface-alt text-ink'
                        : 'border-line bg-surface text-ink-muted'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className="w-4 h-4 rounded-full border border-black/15 shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${t.swatchBg} 45%, ${t.swatchAccent} 100%)`,
                        }}
                      />
                      <span className="truncate">{t.label}</span>
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-brand shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mobile Notifications Dropdown */}
        {notifOpen && (
          <div className="mt-2 bg-surface text-ink rounded-2xl shadow-lg border border-line p-3 z-40">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-line">
              <span className="font-display font-bold text-sm text-ink">التنبيهات الدراسية</span>
              <button
                type="button"
                onClick={() => setNotifOpen(false)}
                className="text-xs text-ink-muted hover:text-ink px-2 py-1"
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
                      isRead ? 'bg-surface-alt/70 text-ink-muted' : 'bg-surface-alt text-ink border border-line'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-bold text-sm">{n.title}</span>
                      <span className="text-[11px] text-ink-muted shrink-0">{n.timeLabel}</span>
                    </div>
                    <p className="text-xs text-ink-muted leading-relaxed">{n.body}</p>
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
        style={{ background: 'var(--app-header-grad)' }}
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

          {/* Zone 2: Single-Line Nav Links */}
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

          {/* Zone 3: Theme + Notifications + Primary CTA */}
          <div className="flex items-center gap-2.5 shrink-0 relative" ref={desktopNotifRef}>
            <button
              type="button"
              onClick={() => {
                setThemeOpen((prev) => !prev);
                setNotifOpen(false);
              }}
              aria-label="تغيير لون التطبيق"
              className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/15 transition-colors"
            >
              <Palette className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setNotifOpen((prev) => !prev);
                setThemeOpen(false);
              }}
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

            {themeOpen && (
              <div className="hidden lg:block absolute left-0 top-12 w-64 bg-surface text-ink rounded-2xl shadow-xl border border-line p-3 z-50 space-y-2">
                <div className="font-display font-bold text-xs text-ink pb-1.5 border-b border-line">
                  اختر لون التطبيق (5 ألوان)
                </div>
                <div className="space-y-1.5">
                  {APP_THEMES.map((t) => {
                    const isSelected = currentTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          onSelectTheme(t.id);
                          setThemeOpen(false);
                        }}
                        className={`w-full min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-display font-bold flex items-center justify-between gap-2 transition-colors ${
                          isSelected
                            ? 'border-ink bg-surface-alt text-ink'
                            : 'border-line bg-surface text-ink-muted hover:text-ink hover:bg-surface-alt'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-full border border-black/15 shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${t.swatchBg} 45%, ${t.swatchAccent} 100%)`,
                            }}
                          />
                          <span>{t.label}</span>
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-brand" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {notifOpen && (
              <div className="hidden lg:block absolute left-0 top-12 w-80 bg-surface text-ink rounded-2xl shadow-xl border border-line p-3 z-50">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-line">
                  <span className="font-display font-bold text-sm">التنبيهات الدراسية</span>
                  <span className="text-xs text-ink-muted tabular-nums">{points} نقطة</span>
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
                          isRead
                            ? 'bg-surface-alt/70 text-ink-muted'
                            : 'bg-surface-alt text-ink border border-line'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display font-bold text-xs">{n.title}</span>
                          <span className="text-[11px] text-ink-muted shrink-0">{n.timeLabel}</span>
                        </div>
                        <p className="text-xs text-ink-muted leading-relaxed">{n.body}</p>
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
