import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ArrowRight,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  Clock,
  Zap,
  Trophy,
  Users,
  LogIn,
} from 'lucide-react';
import {
  AppThemeId,
  Lesson,
  PublicProfile,
  StudentProgress,
  Subject,
  SubjectId,
  Unit,
} from '../types';
import {
  LEADERBOARD_PEERS,
  calculateOverallProgress,
  calculateSubjectProgress,
  getLevelTitle,
  getTodayKey,
} from '../data/curriculum';
import { PWAInstallButton } from './PWAInstallButton';
import { ThemeSwitcher } from './ThemeSwitcher';

interface HomeViewProps {
  subjects: Subject[];
  activeSubjectId: SubjectId | null;
  onSelectSubjectPage: (subjectId: SubjectId | null) => void;
  units: Unit[];
  lessons: Lesson[];
  progress: StudentProgress;
  friendProfiles?: Record<string, PublicProfile>;
  myFriendCode?: string;
  isSignedIn?: boolean;
  authError?: string | null;
  onSignInGoogle?: () => Promise<void>;
  onStudyLesson: (lessonId: string) => void;
  onQuizLesson: (lesson: Lesson) => void;
  onDailyCheckIn: () => void;
  onStartDailyChallenge: () => void;
  onOpenFriends: () => void;
  currentTheme: AppThemeId;
  onSelectTheme: (theme: AppThemeId) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  subjects,
  activeSubjectId,
  onSelectSubjectPage,
  units,
  lessons,
  progress,
  friendProfiles = {},
  myFriendCode,
  isSignedIn = false,
  authError,
  onSignInGoogle,
  onStudyLesson,
  onQuizLesson,
  onDailyCheckIn,
  onStartDailyChallenge,
  onOpenFriends,
  currentTheme,
  onSelectTheme,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const todayKey = getTodayKey();
  const checkedInToday = progress.lastCheckInDate === todayKey;
  const challengeDoneToday = progress.completedChallengeDate === todayKey;

  const overallPct = calculateOverallProgress(progress);
  const levelName = getLevelTitle(overallPct, progress.points);

  const honorBoard = useMemo(() => {
    const liveFriends = Object.values(friendProfiles).map((fp) => ({
      id: fp.uid,
      name: fp.displayName,
      avatar: fp.avatarEmoji,
      points: fp.points,
      isMe: false,
      isFriend: true,
    }));

    const entries = [
      ...liveFriends,
      ...LEADERBOARD_PEERS,
      {
        id: 'me',
        name: progress.studentName,
        avatar: progress.avatarEmoji,
        points: progress.points,
        isMe: true,
        isFriend: false,
      },
    ];
    return entries.sort((a, b) => b.points - a.points);
  }, [friendProfiles, progress.studentName, progress.avatarEmoji, progress.points]);

  const myRank = honorBoard.findIndex((e) => e.isMe) + 1;

  const filteredSubjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) => s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q)
    );
  }, [subjects, searchQuery]);

  const activeSubject = activeSubjectId
    ? subjects.find((s) => s.id === activeSubjectId) || null
    : null;

  return (
    <div className="space-y-5">
      {/* Level & Points Banner */}
      <section
        aria-label="مستوى الطالب"
        className="text-white px-4 py-3 rounded-[16px] text-center text-sm sm:text-base font-display font-bold shadow-xs flex flex-wrap items-center justify-center gap-x-3 gap-y-1 tabular-nums"
        style={{ backgroundColor: 'var(--app-banner-bg)' }}
      >
        <span>
          مستواك: <strong className="text-[#FFD93D]">{levelName}</strong>
        </span>
        <span aria-hidden="true" className="text-white/30">
          |
        </span>
        <span>
          نقطك: <strong className="text-[#FFD93D]">{progress.points}</strong> ⭐
        </span>
        <span aria-hidden="true" className="text-white/30">
          |
        </span>
        <span>
          تقدمك: <strong className="text-[#FFD93D]">{overallPct}%</strong>
        </span>
      </section>

      {!activeSubject ? (
        /* ================= ALL SUBJECTS + STREAK + CHALLENGE ================= */
        <div className="space-y-5">
          {/* 5-Color Theme Picker */}
          <ThemeSwitcher currentTheme={currentTheme} onSelectTheme={onSelectTheme} />

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
            <div>
              <h1 className="font-display text-2xl sm:text-[28px] font-black text-ink leading-tight">
                هتذاكر إيه النهارده؟ 🤔
              </h1>
              <p className="text-sm sm:text-base text-ink-muted mt-1">
                اختار مادة وابدأ، انت قدها يا TOP1 💪
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-ink-muted absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="دور على مادة..."
                aria-label="ابحث عن مادة"
                className="w-full min-h-[46px] pr-11 pl-4 py-2.5 rounded-full bg-surface border border-line shadow-[0_2px_8px_rgba(0,0,0,0.05)] text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Right/Main Column on Desktop: 7 Subjects */}
            <div className="lg:col-span-7 space-y-3.5">
              {filteredSubjects.length === 0 ? (
                <div className="bg-surface rounded-[22px] border border-line p-8 text-center space-y-2">
                  <p className="font-display font-bold text-ink">مفيش مادة مطابقة لبحثك</p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-sm font-display font-bold text-brand underline"
                  >
                    اعرض كل المواد
                  </button>
                </div>
              ) : (
                filteredSubjects.map((sub) => {
                  const subPct = calculateSubjectProgress(sub.id, progress.completedLessonIds);
                  const subLessons = lessons.filter((l) => l.subjectId === sub.id);
                  const subDone = subLessons.filter((l) =>
                    progress.completedLessonIds.includes(l.id)
                  ).length;

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => onSelectSubjectPage(sub.id)}
                      className="w-full text-right bg-surface rounded-[22px] p-4 sm:p-5 border border-line shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-md hover:border-brand/60 active:scale-[0.99] transition-all flex items-center gap-4 focus-visible:outline-2 focus-visible:outline-brand"
                    >
                      <div
                        className="w-14 h-14 rounded-[18px] flex items-center justify-center text-3xl shrink-0"
                        style={{ backgroundColor: sub.bg }}
                        aria-hidden="true"
                      >
                        {sub.emoji}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h2 className="font-display text-lg sm:text-[19px] font-black text-ink truncate">
                            {sub.name}
                          </h2>
                          <span className="font-display font-extrabold text-xs text-ink-muted tabular-nums shrink-0">
                            {subPct}% ({subDone}/{subLessons.length})
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-ink-muted mt-0.5 truncate">{sub.desc}</p>

                        <div className="h-2 bg-surface-alt rounded-full overflow-hidden mt-2.5">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${subPct}%`,
                              background: 'linear-gradient(90deg, #FFD93D, #FF5A7A)',
                            }}
                          />
                        </div>
                      </div>

                      <ChevronLeft className="w-5 h-5 text-ink-muted/60 shrink-0" aria-hidden="true" />
                    </button>
                  );
                })
              )}

              <p className="text-center text-xs sm:text-sm text-ink-muted py-1 font-medium">
                7 مواد · 65 درساً · خلصهم كلهم وتبقى TOP1 🏆
              </p>
            </div>

            {/* Left/Engagement Column on Desktop: Streak + Daily Challenge + Leaderboard */}
            <aside className="lg:col-span-5 space-y-4">
              {/* Streak Box */}
              <div
                className="rounded-[22px] p-4 sm:p-5 text-[#0F172A] shadow-sm space-y-3"
                style={{ background: 'linear-gradient(90deg, #FF7A3D, #FFD93D)' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg sm:text-xl font-black">
                      سلسلة المذاكرة: <span className="tabular-nums">{progress.streakDays}</span> أيام
                    </h2>
                    <p className="text-xs sm:text-sm font-medium text-[#0F172A]/85 mt-0.5">
                      {checkedInToday
                        ? 'تم تسجيل حضورك اليوم بنجاح!'
                        : 'سجّل دخولك اليومي واكسب +15 نقطة فورية'}
                    </p>
                  </div>
                  <div className="text-4xl leading-none shrink-0" aria-hidden="true">
                    🔥
                  </div>
                </div>

                <button
                  type="button"
                  disabled={checkedInToday}
                  onClick={onDailyCheckIn}
                  className={`w-full min-h-[44px] px-4 py-2 rounded-full font-display font-extrabold text-sm transition-all flex items-center justify-center gap-2 ${
                    checkedInToday
                      ? 'bg-white/75 text-[#0F172A] cursor-default'
                      : 'bg-[#0F172A] text-white hover:bg-[#1E293B] active:scale-[0.98]'
                  }`}
                >
                  {checkedInToday ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>تم تسجيل حضور اليوم</span>
                    </>
                  ) : (
                    <span>سجّل حضور اليوم (+15 نقطة)</span>
                  )}
                </button>
              </div>

              {/* Daily Challenge Card */}
              <div
                className="text-white rounded-[22px] p-5 shadow-sm space-y-3"
                style={{ backgroundColor: 'var(--app-banner-bg)' }}
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-black flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#FFD93D]" />
                    <span>تحدي اليوم السريع</span>
                  </h2>
                  <span className="text-xs font-display font-bold text-[#FFD93D] tabular-nums">
                    +60 نقطة
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                  5 أسئلة متنوعة من مواد أولى ثانوي — خلّص التحدي عشان ترفع نقاطك وترتيبك في لوحة الشرف.
                </p>

                <button
                  type="button"
                  onClick={onStartDailyChallenge}
                  className="w-full min-h-[46px] px-5 py-2.5 rounded-full bg-[#FFD93D] text-[#0F172A] font-display font-black text-sm sm:text-base hover:brightness-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  {challengeDoneToday ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                      <span>تم إنجاز تحدي اليوم · أعد المحاولة</span>
                    </>
                  ) : (
                    <span>ابدأ تحدي اليوم ⚡</span>
                  )}
                </button>
              </div>

              {/* لوحة الشرف (Honor Board) */}
              <div className="bg-surface rounded-[22px] p-5 border border-line shadow-[0_4px_14px_rgba(0,0,0,0.06)] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-black text-ink flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#FFD93D]" aria-hidden="true" />
                    <span>لوحة الشرف</span>
                  </h2>
                  <span className="text-xs font-display font-bold text-ink-muted tabular-nums">
                    ترتيبك الحالي: #{myRank}
                  </span>
                </div>

                <div className="divide-y divide-line">
                  {honorBoard.slice(0, 7).map((entry, idx) => {
                    const rank = idx + 1;
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between gap-3 py-2.5 px-2.5 ${
                          entry.isMe ? 'bg-[#FFF3CD] text-[#0F172A] rounded-xl my-1 font-bold' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-black text-xs shrink-0 tabular-nums ${
                              rank === 1
                                ? 'bg-[#FFD93D] text-[#0F172A]'
                                : rank === 2
                                ? 'bg-slate-200 text-[#0F172A]'
                                : rank === 3
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-surface-alt text-ink-muted'
                            }`}
                          >
                            {rank}
                          </span>
                          <span className="text-lg shrink-0" aria-hidden="true">
                            {entry.avatar}
                          </span>
                          <span
                            className={`text-sm font-display font-bold truncate ${
                              entry.isMe ? 'text-[#0F172A]' : 'text-ink'
                            }`}
                          >
                            {entry.name}
                            {entry.isMe ? ' (أنت)' : entry.isFriend ? ' · صديقك' : ''}
                          </span>
                        </div>

                        <span
                          className={`font-display font-extrabold text-xs sm:text-sm tabular-nums shrink-0 ${
                            entry.isMe ? 'text-[#0F172A]' : 'text-ink'
                          }`}
                        >
                          {entry.points} ⭐
                        </span>
                      </div>
                    );
                  })}
                </div>

                {!isSignedIn && onSignInGoogle && (
                  <div className="pt-2 border-t border-line space-y-2">
                    {authError && (
                      <p className="text-xs font-display font-bold text-rose-700 bg-rose-50 rounded-xl px-3 py-2">
                        {authError}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => void onSignInGoogle()}
                      className="w-full min-h-[44px] px-4 py-2 rounded-full bg-primary-btn text-primary-btn-ink font-display font-extrabold text-xs sm:text-sm hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-4 h-4 text-[#FFD93D]" aria-hidden="true" />
                      <span>تسجيل الدخول بجوجل لمنافسة أصحابك</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Friends Chat & App Install Shortcut Card */}
              <div className="bg-surface rounded-[22px] p-5 border border-line shadow-[0_4px_14px_rgba(0,0,0,0.06)] space-y-3.5">
                <div className="space-y-1">
                  <h2 className="font-display text-lg font-black text-ink flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#17B8A6]" aria-hidden="true" />
                    <span>ابعت لأصحابك وتثبيت TOP1</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                    راسل أصحابك وتحداهم في الاختبارات، أو ثبّت TOP1 على موبايلك وشاركه معاهم.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onOpenFriends}
                  className="w-full min-h-[44px] px-4 py-2 rounded-full bg-[#17B8A6] text-white font-display font-extrabold text-sm hover:brightness-95 transition-all flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" aria-hidden="true" />
                  <span>فتح محادثات الأصدقاء</span>
                </button>

                <PWAInstallButton variant="compact" inviteCode={myFriendCode} />
              </div>
            </aside>
          </div>
        </div>
      ) : (
        /* ================= SUBJECT UNITS & LESSONS PAGE ================= */
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => onSelectSubjectPage(null)}
            className="min-h-[44px] px-5 py-2 rounded-full bg-primary-btn text-primary-btn-ink font-display font-extrabold text-sm inline-flex items-center gap-2 hover:opacity-90 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>رجوع لكل المواد</span>
          </button>

          <div className="bg-surface rounded-[22px] p-5 border border-line shadow-xs space-y-3">
            <div className="flex items-center gap-3.5">
              <div
                className="w-13 h-13 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: activeSubject.bg }}
              >
                {activeSubject.emoji}
              </div>
              <div className="flex-1">
                <h1 className="font-display text-2xl font-black text-ink">
                  {activeSubject.name}
                </h1>
                <p className="text-sm text-ink-muted">
                  {activeSubject.desc} · تقدمك:{' '}
                  <strong className="text-ink tabular-nums">
                    {calculateSubjectProgress(activeSubject.id, progress.completedLessonIds)}%
                  </strong>
                </p>
              </div>
            </div>

            <div className="h-2.5 bg-surface-alt rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${calculateSubjectProgress(
                    activeSubject.id,
                    progress.completedLessonIds
                  )}%`,
                  background: 'linear-gradient(90deg, #FFD93D, #FF5A7A)',
                }}
              />
            </div>
          </div>

          <div className="space-y-6">
            {units
              .filter((u) => u.subjectId === activeSubject.id)
              .map((unit) => {
                const unitLessons = lessons.filter((l) => l.unitId === unit.id);
                return (
                  <section key={unit.id} className="space-y-3">
                    <h2 className="font-display text-lg font-black text-ink px-1">
                      {unit.title}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {unitLessons.map((lesson) => {
                        const isDone = progress.completedLessonIds.includes(lesson.id);

                        return (
                          <div
                            key={lesson.id}
                            className="bg-surface rounded-[20px] p-4 sm:p-5 border border-line shadow-[0_3px_10px_rgba(0,0,0,0.05)] flex flex-col justify-between gap-3.5"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2 text-xs text-ink-muted">
                                <span className="inline-flex items-center gap-1 tabular-nums">
                                  <Clock className="w-3.5 h-3.5 text-[#2EC4B6]" />
                                  <span>
                                    {lesson.branch} · {lesson.durationMinutes} دقيقة
                                  </span>
                                </span>

                                {isDone && (
                                  <span className="inline-flex items-center gap-1 font-display font-bold text-[#17B8A6]">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>مكتمل</span>
                                  </span>
                                )}
                              </div>

                              <h3 className="font-display text-base sm:text-[17px] font-black text-ink">
                                {lesson.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-ink-muted line-clamp-2">
                                {lesson.summary}
                              </p>
                            </div>

                            <div className="flex items-center gap-2.5 pt-1">
                              <button
                                type="button"
                                onClick={() => onStudyLesson(lesson.id)}
                                className="flex-1 min-h-[42px] px-3 py-2 rounded-full bg-[#FFF3CD] text-[#7A5A00] font-display font-extrabold text-xs sm:text-sm hover:brightness-95 transition-all inline-flex items-center justify-center gap-1.5"
                              >
                                <BookOpen className="w-4 h-4" />
                                <span>ذاكر الدرس</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onQuizLesson(lesson)}
                                className="flex-1 min-h-[42px] px-3 py-2 rounded-full bg-primary-btn text-primary-btn-ink font-display font-extrabold text-xs sm:text-sm hover:opacity-90 transition-colors inline-flex items-center justify-center gap-1.5"
                              >
                                <HelpCircle className="w-4 h-4 text-[#FFD93D]" />
                                <span>اختبر نفسك</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
