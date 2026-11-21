import React, { useState } from 'react';
import {
  Star,
  BookCheck,
  Trophy,
  Flame,
  Edit3,
  Check,
  RotateCcw,
  Award,
  LogIn,
  LogOut,
} from 'lucide-react';
import { AppThemeId, Lesson, Quiz, StudentProgress, Subject } from '../types';
import { calculateOverallProgress, calculateSubjectProgress, getLevelTitle } from '../data/curriculum';
import { PWAInstallButton } from './PWAInstallButton';
import { ThemeSwitcher } from './ThemeSwitcher';

interface ProfileViewProps {
  subjects: Subject[];
  lessons: Lesson[];
  quizzes: Quiz[];
  progress: StudentProgress;
  myFriendCode?: string;
  isSignedIn?: boolean;
  userEmail?: string | null;
  authError?: string | null;
  onSignInGoogle?: () => Promise<void>;
  onSignOutGoogle?: () => Promise<void>;
  onUpdateProfile: (name: string, avatarEmoji: string) => void;
  onResetProgress: () => void;
  currentTheme: AppThemeId;
  onSelectTheme: (theme: AppThemeId) => void;
}

const AVATAR_CHOICES = ['🧑‍🎓', '👩‍🎓', '📚', '✍️', '🌟'];

export const ProfileView: React.FC<ProfileViewProps> = ({
  subjects,
  lessons,
  quizzes,
  progress,
  myFriendCode,
  isSignedIn = false,
  userEmail,
  authError,
  onSignInGoogle,
  onSignOutGoogle,
  onUpdateProfile,
  onResetProgress,
  currentTheme,
  onSelectTheme,
}) => {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(progress.studentName);
  const [selectedEmoji, setSelectedEmoji] = useState(progress.avatarEmoji);
  const [confirmReset, setConfirmReset] = useState(false);

  const overallPct = calculateOverallProgress(progress);
  const levelName = getLevelTitle(overallPct, progress.points);
  const passedQuizzesCount = Object.keys(progress.quizAttempts).length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim() || 'بطل أولى ثانوي';
    onUpdateProfile(trimmed, selectedEmoji);
    setEditing(false);
  };

  const achievements = [
    {
      id: 'a1',
      title: 'بداية متفوقة',
      desc: 'إتمام أول 3 دروس في أي مادة',
      unlocked: progress.completedLessonIds.length >= 3,
    },
    {
      id: 'a2',
      title: 'فارس المروءة',
      desc: 'إتمام درس مكارم الأخلاق وحاتم الطائي',
      unlocked: progress.completedLessonIds.includes('ar-1'),
    },
    {
      id: 'a3',
      title: 'مئوية النقاط',
      desc: 'جمع 100 نقطة أو أكثر من الدروس والاختبارات',
      unlocked: progress.points >= 100,
    },
    {
      id: 'a4',
      title: 'مبرمج بايثون',
      desc: 'إتمام مشروع آلة حاسبة ببايثون',
      unlocked: progress.completedLessonIds.includes('co-9'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Student Card */}
      <section className="bg-surface rounded-[24px] border border-line p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-3xl sm:text-4xl border-4 border-[#FFD6DE] shrink-0"
              style={{ background: 'linear-gradient(135deg, #E9FAF8, #FFF0F4)' }}
            >
              {progress.avatarEmoji}
            </div>

            {!editing ? (
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-black text-ink">
                  {progress.studentName}
                </h2>
                <p className="text-sm text-ink-muted mt-0.5">
                  المستوى: {levelName} · التقدم العام {overallPct}%
                </p>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-3">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={32}
                  aria-label="اسم الطالب في التطبيق"
                  className="min-h-[42px] px-3.5 py-1.5 rounded-xl border border-line bg-surface-alt text-sm font-display font-bold text-ink focus:outline-none focus:border-brand"
                />
                <div className="flex items-center gap-2">
                  {AVATAR_CHOICES.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`w-10 h-10 rounded-full text-xl flex items-center justify-center border-2 transition-transform ${
                        selectedEmoji === emoji
                          ? 'border-[#17B8A6] bg-[#E9FAF8] scale-105'
                          : 'border-line bg-surface-alt'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="min-h-[40px] px-4 py-1.5 rounded-full bg-[#17B8A6] text-white text-xs font-display font-bold flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>حفظ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setNameInput(progress.studentName);
                      setSelectedEmoji(progress.avatarEmoji);
                    }}
                    className="min-h-[40px] px-4 py-1.5 rounded-full bg-surface-alt text-ink text-xs font-display font-bold border border-line"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>

          {!editing && (
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => {
                  setNameInput(progress.studentName);
                  setSelectedEmoji(progress.avatarEmoji);
                  setEditing(true);
                }}
                className="min-h-[44px] px-4 py-2 rounded-full border border-line bg-surface-alt text-sm font-display font-bold text-ink hover:opacity-90 flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4 text-[#17B8A6]" />
                <span>تعديل اسمي في التطبيق</span>
              </button>

              {!isSignedIn && onSignInGoogle ? (
                <button
                  type="button"
                  onClick={() => void onSignInGoogle()}
                  className="min-h-[44px] px-4 py-2 rounded-full bg-primary-btn text-primary-btn-ink text-sm font-display font-bold hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-[#FFD93D]" aria-hidden="true" />
                  <span>دخول بجوجل</span>
                </button>
              ) : isSignedIn && onSignOutGoogle ? (
                <button
                  type="button"
                  onClick={() => void onSignOutGoogle()}
                  className="min-h-[44px] px-4 py-2 rounded-full border border-line bg-surface-alt text-xs font-display font-bold text-ink-muted hover:text-rose-600 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>خروج ({userEmail || 'جوجل'})</span>
                </button>
              ) : null}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-line">
          <ThemeSwitcher currentTheme={currentTheme} onSelectTheme={onSelectTheme} compact />
        </div>

        {authError && (
          <p className="text-xs font-display font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2">
            {authError}
          </p>
        )}
      </section>

      {/* 4-Column Stats Grid */}
      <section aria-label="إحصائيات الطالب" className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-surface rounded-2xl border border-line p-4 space-y-1">
          <div className="flex items-center justify-between text-ink-muted text-xs">
            <span>إجمالي النقاط</span>
            <Star className="w-4 h-4 fill-[#FFD93D] text-[#FFD93D]" />
          </div>
          <div className="font-display text-2xl font-black text-ink tabular-nums">
            {progress.points}
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-line p-4 space-y-1">
          <div className="flex items-center justify-between text-ink-muted text-xs">
            <span>الدروس المكتملة</span>
            <BookCheck className="w-4 h-4 text-[#17B8A6]" />
          </div>
          <div className="font-display text-2xl font-black text-ink tabular-nums">
            {progress.completedLessonIds.length} / {lessons.length}
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-line p-4 space-y-1">
          <div className="flex items-center justify-between text-ink-muted text-xs">
            <span>الاختبارات المجتازة</span>
            <Trophy className="w-4 h-4 text-brand" />
          </div>
          <div className="font-display text-2xl font-black text-ink tabular-nums">
            {passedQuizzesCount} / {quizzes.length}+
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-line p-4 space-y-1">
          <div className="flex items-center justify-between text-ink-muted text-xs">
            <span>أيام المذاكرة</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-display text-2xl font-black text-ink tabular-nums">
            {progress.streakDays} أيام
          </div>
        </div>
      </section>

      {/* Two-Column Breakdown: 7 Subjects Mastery + Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-surface rounded-[22px] border border-line p-5 space-y-4">
          <h3 className="font-display text-lg font-black text-ink">تقدمك في الـ 7 مواد</h3>
          <div className="space-y-4">
            {subjects.map((subject) => {
              const pct = calculateSubjectProgress(subject.id, progress.completedLessonIds);
              return (
                <div key={subject.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm font-display font-bold text-ink">
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden="true">{subject.emoji}</span>
                      <span>{subject.name}</span>
                    </span>
                    <span className="tabular-nums">{pct}%</span>
                  </div>
                  <div className="h-2.5 bg-surface-alt rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #FFD93D, #FF5A7A)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-surface rounded-[22px] border border-line p-5 space-y-4">
          <h3 className="font-display text-lg font-black text-ink">الإنجازات والأوسمة</h3>
          <div className="divide-y divide-line">
            {achievements.map((item) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      item.unlocked
                        ? 'bg-[#E9FAF8] text-[#17B8A6]'
                        : 'bg-surface-alt text-ink-muted'
                    }`}
                  >
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm text-ink">{item.title}</div>
                    <div className="text-xs text-ink-muted">{item.desc}</div>
                  </div>
                </div>
                <span
                  className={`text-xs font-display font-bold shrink-0 ${
                    item.unlocked ? 'text-[#17B8A6]' : 'text-ink-muted'
                  }`}
                >
                  {item.unlocked ? 'مفتوح' : 'قيد التقدم'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* PWA Install & Share App */}
      <PWAInstallButton variant="card" inviteCode={myFriendCode} />

      {/* Reset Progress Control */}
      <div className="flex justify-end">
        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="min-h-[44px] px-4 py-2 rounded-full text-xs font-display font-bold text-ink-muted hover:text-rose-600 hover:bg-surface-alt flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة ضبط التقدم</span>
          </button>
        ) : (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex flex-wrap items-center gap-3">
            <span className="text-xs font-display font-bold text-rose-900">
              هل تريد تصفير النقاط والتقدم والبدء من جديد؟
            </span>
            <button
              type="button"
              onClick={() => {
                onResetProgress();
                setConfirmReset(false);
              }}
              className="px-4 py-1.5 rounded-full bg-rose-600 text-white text-xs font-display font-bold"
            >
              تأكيد
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="px-4 py-1.5 rounded-full bg-white text-slate-700 text-xs font-display font-bold border border-slate-200"
            >
              إلغاء
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
