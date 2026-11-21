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
  Users,
} from 'lucide-react';
import { Lesson, StudentProgress, Subject, SubjectId, Unit } from '../types';
import {
  calculateOverallProgress,
  calculateSubjectProgress,
  getLevelTitle,
  getTodayKey,
} from '../data/curriculum';
import { PWAInstallButton } from './PWAInstallButton';

interface HomeViewProps {
  subjects: Subject[];
  activeSubjectId: SubjectId | null;
  onSelectSubjectPage: (subjectId: SubjectId | null) => void;
  units: Unit[];
  lessons: Lesson[];
  progress: StudentProgress;
  myFriendCode?: string;
  onStudyLesson: (lessonId: string) => void;
  onQuizLesson: (lesson: Lesson) => void;
  onDailyCheckIn: () => void;
  onStartDailyChallenge: () => void;
  onOpenFriends: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  subjects,
  activeSubjectId,
  onSelectSubjectPage,
  units,
  lessons,
  progress,
  myFriendCode,
  onStudyLesson,
  onQuizLesson,
  onDailyCheckIn,
  onStartDailyChallenge,
  onOpenFriends,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const todayKey = getTodayKey();
  const checkedInToday = progress.lastCheckInDate === todayKey;
  const challengeDoneToday = progress.completedChallengeDate === todayKey;

  const overallPct = calculateOverallProgress(progress);
  const levelName = getLevelTitle(overallPct, progress.points);

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
      {/* Level & Points Banner (.level) */}
      <section
        aria-label="مستوى الطالب"
        className="bg-[#0F172A] text-white px-4 py-3 rounded-[16px] text-center text-sm sm:text-base font-display font-bold shadow-xs flex flex-wrap items-center justify-center gap-x-3 gap-y-1 tabular-nums"
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
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
            <div>
              <h1 className="font-display text-2xl sm:text-[28px] font-black text-[#0F172A] leading-tight">
                هتذاكر إيه النهارده؟ 🤔
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-1">
                اختار مادة وابدأ، انت قدها يا TOP1 💪
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="دور على مادة..."
                aria-label="ابحث عن مادة"
                className="w-full min-h-[46px] pr-11 pl-4 py-2.5 rounded-full bg-white border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.05)] text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#FF5A7A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Right/Main Column on Desktop: 7 Subjects */}
            <div className="lg:col-span-7 space-y-3.5">
              {filteredSubjects.length === 0 ? (
                <div className="bg-white rounded-[22px] border border-slate-200/80 p-8 text-center space-y-2">
                  <p className="font-display font-bold text-[#0F172A]">مفيش مادة مطابقة لبحثك</p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-sm font-display font-bold text-[#FF5A7A] underline"
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
                      className="w-full text-right bg-white rounded-[22px] p-4 sm:p-5 border border-slate-200/70 shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-md hover:border-slate-300 active:scale-[0.99] transition-all flex items-center gap-4 focus-visible:outline-2 focus-visible:outline-[#0F172A]"
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
                          <h2 className="font-display text-lg sm:text-[19px] font-black text-[#0F172A] truncate">
                            {sub.name}
                          </h2>
                          <span className="font-display font-extrabold text-xs text-slate-600 tabular-nums shrink-0">
                            {subPct}% ({subDone}/{subLessons.length})
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">{sub.desc}</p>

                        <div className="h-2 bg-[#EEEEEE] rounded-full overflow-hidden mt-2.5">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${subPct}%`,
                              background: 'linear-gradient(90deg, #FFD93D, #FF5A7A)',
                            }}
                          />
                        </div>
                      </div>

                      <ChevronLeft className="w-5 h-5 text-slate-300 shrink-0" aria-hidden="true" />
                    </button>
                  );
                })
              )}

              <p className="text-center text-xs sm:text-sm text-slate-500 py-1 font-medium">
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
                      ? 'bg-white/60 text-[#0F172A] cursor-default'
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
              <div className="bg-[#0F172A] text-white rounded-[22px] p-5 shadow-sm space-y-3">
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
                  5 أسئلة متنوعة من مواد أولى ثانوي — خلّص التحدي عشان تزود نقاطك +60 نقطة.
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

              {/* Friends Chat & App Install Shortcut Card */}
              <div className="bg-white rounded-[22px] p-5 border border-slate-200/80 shadow-[0_4px_14px_rgba(0,0,0,0.06)] space-y-3.5">
                <div className="space-y-1">
                  <h2 className="font-display text-lg font-black text-[#0F172A] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#17B8A6]" aria-hidden="true" />
                    <span>ابعت لأصحابك وتثبيت TOP1</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
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
            className="min-h-[44px] px-5 py-2 rounded-full bg-[#0F172A] text-white font-display font-extrabold text-sm inline-flex items-center gap-2 hover:bg-[#1E293B] transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>رجوع لكل المواد</span>
          </button>

          <div className="bg-white rounded-[22px] p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-3.5">
              <div
                className="w-13 h-13 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: activeSubject.bg }}
              >
                {activeSubject.emoji}
              </div>
              <div className="flex-1">
                <h1 className="font-display text-2xl font-black text-[#0F172A]">
                  {activeSubject.name}
                </h1>
                <p className="text-sm text-slate-600">
                  {activeSubject.desc} · تقدمك:{' '}
                  <strong className="text-[#0F172A] tabular-nums">
                    {calculateSubjectProgress(activeSubject.id, progress.completedLessonIds)}%
                  </strong>
                </p>
              </div>
            </div>

            <div className="h-2.5 bg-[#EEEEEE] rounded-full overflow-hidden">
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
                    <h2 className="font-display text-lg font-black text-[#0F172A] px-1">
                      {unit.title}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {unitLessons.map((lesson) => {
                        const isDone = progress.completedLessonIds.includes(lesson.id);

                        return (
                          <div
                            key={lesson.id}
                            className="bg-white rounded-[20px] p-4 sm:p-5 border border-slate-200/80 shadow-[0_3px_10px_rgba(0,0,0,0.05)] flex flex-col justify-between gap-3.5"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
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

                              <h3 className="font-display text-base sm:text-[17px] font-black text-[#0F172A]">
                                {lesson.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
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
                                className="flex-1 min-h-[42px] px-3 py-2 rounded-full bg-[#0F172A] text-white font-display font-extrabold text-xs sm:text-sm hover:bg-[#1E293B] transition-colors inline-flex items-center justify-center gap-1.5"
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
