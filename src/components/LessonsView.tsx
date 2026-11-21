import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  CheckCircle2,
  Circle,
  ArrowRight,
  HelpCircle,
  Sparkles,
  BookMarked,
} from 'lucide-react';
import { Lesson, StudentProgress, Subject, SubjectId, Unit } from '../types';

interface LessonsViewProps {
  subjects: Subject[];
  selectedSubjectId: SubjectId;
  onSelectSubject: (subjectId: SubjectId) => void;
  units: Unit[];
  lessons: Lesson[];
  progress: StudentProgress;
  selectedUnitId: string | 'all';
  onSelectUnitFilter: (unitId: string | 'all') => void;
  activeLessonId: string | null;
  onSelectLesson: (lessonId: string | null) => void;
  onToggleLessonComplete: (lesson: Lesson) => void;
  onQuizLesson: (lesson: Lesson) => void;
}

export const LessonsView: React.FC<LessonsViewProps> = ({
  subjects,
  selectedSubjectId,
  onSelectSubject,
  units,
  lessons,
  progress,
  selectedUnitId,
  onSelectUnitFilter,
  activeLessonId,
  onSelectLesson,
  onToggleLessonComplete,
  onQuizLesson,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [readerTab, setReaderTab] = useState<'text' | 'vocab' | 'rules'>('text');

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const subjectUnits = useMemo(
    () => units.filter((u) => u.subjectId === selectedSubjectId),
    [units, selectedSubjectId]
  );

  const activeLesson = useMemo(
    () => lessons.find((l) => l.id === activeLessonId) || null,
    [lessons, activeLessonId]
  );

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      if (lesson.subjectId !== selectedSubjectId) return false;
      const matchesUnit = selectedUnitId === 'all' || lesson.unitId === selectedUnitId;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        lesson.title.toLowerCase().includes(q) ||
        lesson.summary.toLowerCase().includes(q) ||
        lesson.branch.toLowerCase().includes(q);
      return matchesUnit && matchesQuery;
    });
  }, [lessons, selectedSubjectId, selectedUnitId, searchQuery]);

  if (activeLesson) {
    const unit = units.find((u) => u.id === activeLesson.unitId);
    const isCompleted = progress.completedLessonIds.includes(activeLesson.id);

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onSelectLesson(null);
              setReaderTab('text');
            }}
            className="min-h-[44px] px-4 py-2 rounded-full bg-surface border border-line text-sm font-display font-bold text-ink hover:bg-surface-alt flex items-center gap-2 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة إلى قائمة الدروس</span>
          </button>

          <div className="text-xs sm:text-sm text-ink-muted flex items-center gap-2 tabular-nums">
            <span>{unit?.title}</span>
            <span aria-hidden="true">·</span>
            <span>{activeLesson.branch}</span>
            <span aria-hidden="true">·</span>
            <span>{activeLesson.durationMinutes} دقيقة</span>
          </div>
        </div>

        <article className="bg-surface rounded-[24px] border border-line shadow-sm p-5 sm:p-8 space-y-6">
          <header className="space-y-2 border-b border-line pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl sm:text-3xl font-black text-ink text-balance">
                {activeLesson.title}
              </h2>
              <div className="flex items-center gap-2 text-sm font-display font-bold">
                {isCompleted ? (
                  <span className="inline-flex items-center gap-1.5 text-[#17B8A6]">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>مكتمل</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-ink-muted">
                    <Sparkles className="w-4 h-4 text-brand" />
                    <span className="tabular-nums">+{activeLesson.pointsReward} نقطة عند الإتمام</span>
                  </span>
                )}
              </div>
            </div>
            <p className="text-ink-muted text-base leading-relaxed">{activeLesson.summary}</p>
          </header>

          {/* Segmented Reader Tabs */}
          <div
            role="tablist"
            aria-label="أقسام الدرس"
            className="flex items-center gap-1.5 p-1 bg-surface-alt rounded-xl w-full sm:w-fit border border-line"
          >
            {[
              { id: 'text', label: 'الشرح والنص' },
              { id: 'vocab', label: `المصطلحات (${activeLesson.vocabulary.length})` },
              { id: 'rules', label: `القواعد والتطبيق (${activeLesson.rules.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={readerTab === tab.id}
                onClick={() => setReaderTab(tab.id as 'text' | 'vocab' | 'rules')}
                className={`flex-1 sm:flex-initial min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-display font-bold whitespace-nowrap transition-colors ${
                  readerTab === tab.id
                    ? 'bg-surface text-ink shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {readerTab === 'text' && (
            <div className="space-y-6">
              <div className="bg-surface-alt rounded-2xl p-5 sm:p-6 border border-line">
                <h3 className="font-display font-bold text-base text-[#17B8A6] mb-3 flex items-center gap-2">
                  <BookMarked className="w-4 h-4" />
                  <span>{activeLesson.passageTitle}</span>
                </h3>
                <div className="space-y-3 text-ink text-base sm:text-lg leading-loose font-medium">
                  {activeLesson.passageLines.map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-display font-bold text-lg text-ink mb-3">
                  أهم النقاط المستفادة
                </h3>
                <ul className="space-y-2.5">
                  {activeLesson.keyTakeaways.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-ink leading-relaxed">
                      <span className="font-display font-black text-[#17B8A6] tabular-nums shrink-0">
                        0{idx + 1}.
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {readerTab === 'vocab' && (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-line text-xs font-display font-bold text-ink-muted">
                    <th className="py-3 px-4">المصطلح / الكلمة</th>
                    <th className="py-3 px-4">المعنى</th>
                    <th className="py-3 px-4">المضاد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-sm sm:text-base">
                  {activeLesson.vocabulary.map((v, idx) => (
                    <tr key={idx} className="hover:bg-surface-alt/60">
                      <td className="py-3.5 px-4 font-display font-bold text-ink">{v.word}</td>
                      <td className="py-3.5 px-4 text-ink-muted">{v.meaning}</td>
                      <td className="py-3.5 px-4 text-ink-muted">{v.opposite || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {readerTab === 'rules' && (
            <div className="space-y-4">
              {activeLesson.rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-2xl bg-surface-alt border border-line space-y-2"
                >
                  <h4 className="font-display font-bold text-base text-ink">{rule.title}</h4>
                  <p className="text-sm sm:text-base text-ink-muted leading-relaxed">{rule.detail}</p>
                  <p className="text-sm font-medium text-[#17B8A6] pt-1">
                    مثال تطبيقي: {rule.example}
                  </p>
                </div>
              ))}
            </div>
          )}

          <footer className="pt-5 border-t border-line flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onToggleLessonComplete(activeLesson)}
              className={`min-h-[48px] px-6 py-3 rounded-full font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-colors ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-[#FFF3CD] text-[#7A5A00] hover:brightness-95'
              }`}
            >
              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              <span>
                {isCompleted
                  ? 'تمت المذاكرة'
                  : `خلصت مذاكرة الدرس (+${activeLesson.pointsReward} نقطة)`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onQuizLesson(activeLesson)}
              className="min-h-[48px] px-6 py-3 rounded-full bg-primary-btn text-primary-btn-ink font-display font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm hover:opacity-90"
            >
              <HelpCircle className="w-5 h-5 text-[#FFD93D]" />
              <span>اختبر نفسك في هذا الدرس ({activeLesson.questions.length} أسئلة)</span>
            </button>
          </footer>
        </article>
      </div>
    );
  }

  const totalSubjectLessons = lessons.filter((l) => l.subjectId === selectedSubjectId).length;

  return (
    <div className="space-y-5">
      {/* 7 Subject Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {subjects.map((subject) => {
          const isActive = subject.id === selectedSubjectId;
          return (
            <button
              key={subject.id}
              type="button"
              onClick={() => {
                onSelectSubject(subject.id);
                onSelectUnitFilter('all');
              }}
              className={`min-h-[44px] px-4 py-2 rounded-full font-display font-extrabold text-sm whitespace-nowrap shrink-0 transition-colors inline-flex items-center gap-1.5 border ${
                isActive
                  ? 'bg-primary-btn text-primary-btn-ink border-transparent'
                  : 'bg-surface text-ink border-line hover:bg-surface-alt'
              }`}
            >
              <span aria-hidden="true">{subject.emoji}</span>
              <span>{subject.name}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-black text-ink">
            دروس {activeSubject.name}
          </h2>
          <p className="text-sm text-ink-muted mt-0.5">{activeSubject.desc}</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-ink-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن درس..."
            className="w-full min-h-[44px] pr-10 pl-4 py-2 rounded-full bg-surface border border-line text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      {/* Unit Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onSelectUnitFilter('all')}
          className={`min-h-[40px] px-4 py-2 rounded-full text-xs sm:text-sm font-display font-bold whitespace-nowrap shrink-0 transition-colors ${
            selectedUnitId === 'all'
              ? 'bg-brand text-white'
              : 'bg-surface text-ink-muted border border-line hover:text-ink'
          }`}
        >
          جميع الوحدات ({totalSubjectLessons})
        </button>

        {subjectUnits.map((u) => {
          const isSelected = selectedUnitId === u.id;
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => onSelectUnitFilter(u.id)}
              className={`min-h-[40px] px-4 py-2 rounded-full text-xs sm:text-sm font-display font-bold whitespace-nowrap shrink-0 transition-colors ${
                isSelected
                  ? 'bg-brand text-white'
                  : 'bg-surface text-ink-muted border border-line hover:text-ink'
              }`}
            >
              {u.title}
            </button>
          );
        })}
      </div>

      {/* Lessons Grid */}
      {filteredLessons.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-line p-8 text-center space-y-2">
          <BookOpen className="w-10 h-10 text-ink-muted mx-auto" />
          <p className="font-display font-bold text-ink">لم يتم العثور على دروس مطابقة</p>
          <p className="text-sm text-ink-muted">جرّب كلمة بحث أخرى أو اختر جميع الوحدات</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLessons.map((lesson) => {
            const unit = units.find((u) => u.id === lesson.unitId);
            const isCompleted = progress.completedLessonIds.includes(lesson.id);

            return (
              <div
                key={lesson.id}
                className="bg-surface rounded-2xl border border-line p-4 sm:p-5 hover:border-brand/60 hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs text-ink-muted">
                    <span className="font-medium truncate">
                      {unit?.title} · {lesson.branch}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-display font-bold shrink-0 ${
                        isCompleted ? 'text-[#17B8A6]' : 'text-ink-muted'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>مكتمل</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4" />
                          <span>متاح</span>
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="font-display font-black text-lg text-ink leading-snug">
                    {lesson.title}
                  </h3>
                  <p className="text-sm text-ink-muted leading-relaxed line-clamp-2">
                    {lesson.summary}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 pt-2 border-t border-line">
                  <button
                    type="button"
                    onClick={() => onSelectLesson(lesson.id)}
                    className="flex-1 min-h-[40px] px-3 py-2 rounded-full bg-[#FFF3CD] text-[#7A5A00] font-display font-extrabold text-xs sm:text-sm hover:brightness-95 flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>ذاكر الدرس</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onQuizLesson(lesson)}
                    className="flex-1 min-h-[40px] px-3 py-2 rounded-full bg-primary-btn text-primary-btn-ink font-display font-extrabold text-xs sm:text-sm hover:opacity-90 flex items-center justify-center gap-1.5"
                  >
                    <HelpCircle className="w-4 h-4 text-[#FFD93D]" />
                    <span>اختبر نفسك</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
