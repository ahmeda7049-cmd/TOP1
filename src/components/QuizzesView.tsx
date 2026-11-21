import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Trophy,
  RotateCcw,
  ArrowRight,
  Star,
  BookOpen,
  Send,
} from 'lucide-react';
import { ChallengeReplyTarget, Quiz, StudentProgress, Subject, SubjectId } from '../types';

interface QuizzesViewProps {
  subjects: Subject[];
  selectedSubjectId: SubjectId;
  onSelectSubject: (subjectId: SubjectId) => void;
  quizzes: Quiz[];
  progress: StudentProgress;
  activeQuiz: Quiz | null;
  onSelectQuiz: (quiz: Quiz | null) => void;
  onCompleteQuiz: (quiz: Quiz, score: number) => number;
  onOpenLesson: (lessonId: string) => void;
  onBackHome: () => void;
  challengeTarget?: ChallengeReplyTarget | null;
  onSendScoreToFriend?: (
    quiz: Quiz,
    score: number,
    total: number,
    target: ChallengeReplyTarget
  ) => Promise<void>;
}

export const QuizzesView: React.FC<QuizzesViewProps> = ({
  subjects,
  selectedSubjectId,
  onSelectSubject,
  quizzes,
  progress,
  activeQuiz,
  onSelectQuiz,
  onCompleteQuiz,
  onOpenLesson,
  onBackHome,
  challengeTarget,
  onSendScoreToFriend,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'active-subject'>('all');

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [sendingScore, setSendingScore] = useState(false);
  const [scoreSent, setScoreSent] = useState(false);

  useEffect(() => {
    setCurrentIdx(0);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setEarnedPoints(0);
    setElapsedSeconds(0);
    setShowReview(false);
    setScoreSent(false);
  }, [activeQuiz?.id]);

  useEffect(() => {
    if (!activeQuiz || isSubmitted) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeQuiz, isSubmitted]);

  const formatDuration = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (activeQuiz) {
    const currentQuestion = activeQuiz.questions[currentIdx];
    const selectedOption = selectedAnswers[currentQuestion.id];
    const hasAnsweredCurrent = selectedOption !== undefined;
    const isCurrentCorrect = selectedOption === currentQuestion.correctIndex;
    const totalQuestions = activeQuiz.questions.length;

    const handleChooseOption = (optIndex: number) => {
      if (hasAnsweredCurrent) return;
      setSelectedAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: optIndex,
      }));
    };

    const handleNextOrFinish = () => {
      if (currentIdx < totalQuestions - 1) {
        setCurrentIdx((prev) => prev + 1);
      } else {
        const score = activeQuiz.questions.reduce((acc, q) => {
          return acc + (selectedAnswers[q.id] === q.correctIndex ? 1 : 0);
        }, 0);
        const pts = onCompleteQuiz(activeQuiz, score);
        setEarnedPoints(pts);
        setIsSubmitted(true);
      }
    };

    const handleRetry = () => {
      setCurrentIdx(0);
      setSelectedAnswers({});
      setIsSubmitted(false);
      setEarnedPoints(0);
      setElapsedSeconds(0);
      setShowReview(false);
    };

    if (isSubmitted) {
      const score = activeQuiz.questions.reduce((acc, q) => {
        return acc + (selectedAnswers[q.id] === q.correctIndex ? 1 : 0);
      }, 0);
      const pct = Math.round((score / totalQuestions) * 100);

      return (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-[24px] border-2 border-[#7EDDD6] p-6 sm:p-8 text-center shadow-sm space-y-5">
            <div className="w-20 h-20 rounded-full mx-auto bg-[#E9FAF8] flex items-center justify-center text-[#17B8A6]">
              <Trophy className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="font-display text-2xl sm:text-3xl font-black text-[#0F172A]">
                {pct >= 80
                  ? 'عاش! أداء بمستوى TOP1 🏆'
                  : pct >= 50
                  ? 'نتيجة حلوة! كمل يا بطل 💪'
                  : 'محتاج تراجع الدرس وتجرب تاني 📖'}
              </h2>
              <p className="text-sm text-slate-600">{activeQuiz.title}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-[#FFF9FA] rounded-2xl p-3.5 border border-slate-100">
                <div className="text-xs text-slate-500">النتيجة</div>
                <div className="font-display text-xl sm:text-2xl font-black text-[#0F172A] tabular-nums mt-1">
                  {score} / {totalQuestions}
                </div>
              </div>
              <div className="bg-[#FFF9FA] rounded-2xl p-3.5 border border-slate-100">
                <div className="text-xs text-slate-500">النسبة المئوية</div>
                <div className="font-display text-xl sm:text-2xl font-black text-[#17B8A6] tabular-nums mt-1">
                  {pct}%
                </div>
              </div>
              <div className="bg-[#FFF9FA] rounded-2xl p-3.5 border border-slate-100">
                <div className="text-xs text-slate-500">الوقت المستغرق</div>
                <div className="font-display text-xl sm:text-2xl font-black text-[#0F172A] tabular-nums mt-1">
                  {formatDuration(elapsedSeconds)}
                </div>
              </div>
            </div>

            {earnedPoints > 0 && (
              <div className="py-2.5 px-4 rounded-xl bg-[#E9FAF8] text-[#0F172A] text-sm font-display font-bold inline-flex items-center gap-2">
                <Star className="w-4 h-4 fill-[#FFD93D] text-[#FFD93D]" />
                <span className="tabular-nums">حصلت على +{earnedPoints} نقطة جديدة!</span>
              </div>
            )}

            {challengeTarget && onSendScoreToFriend && (
              <div className="pt-1">
                <button
                  type="button"
                  disabled={sendingScore || scoreSent}
                  onClick={async () => {
                    setSendingScore(true);
                    try {
                      await onSendScoreToFriend(activeQuiz, score, totalQuestions, challengeTarget);
                      setScoreSent(true);
                    } finally {
                      setSendingScore(false);
                    }
                  }}
                  className="w-full min-h-[48px] px-5 py-3 rounded-full bg-[#FFD93D] text-[#0F172A] font-display font-black text-sm sm:text-base hover:brightness-95 disabled:opacity-75 inline-flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {scoreSent
                      ? `تم إرسال نتيجتك إلى ${challengeTarget.friendName}! ✅`
                      : sendingScore
                      ? 'جاري إرسال النتيجة...'
                      : `ابعت نتيجتك إلى ${challengeTarget.friendName} 🏆`}
                  </span>
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleRetry}
                className="flex-1 min-h-[48px] px-5 py-3 rounded-full text-white font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(90deg, #0F172A, #FF5A7A)' }}
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة الاختبار</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReview((prev) => !prev)}
                className="flex-1 min-h-[48px] px-5 py-3 rounded-full bg-white border border-slate-200 text-[#0F172A] font-display font-bold text-sm sm:text-base hover:bg-slate-50"
              >
                {showReview ? 'إخفاء المراجعة' : 'مراجعة الإجابات'}
              </button>
              <button
                type="button"
                onClick={onBackHome}
                className="min-h-[48px] px-5 py-3 rounded-full bg-[#17B8A6] text-white font-display font-bold text-sm sm:text-base"
              >
                الرئيسية
              </button>
            </div>
          </div>

          {showReview && (
            <div className="space-y-3">
              {activeQuiz.questions.map((q, idx) => {
                const userChoice = selectedAnswers[q.id];
                const correct = userChoice === q.correctIndex;
                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-display font-bold">
                      <span className="text-slate-500 tabular-nums">سؤال {idx + 1}</span>
                      <span
                        className={`inline-flex items-center gap-1 ${
                          correct ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {correct ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>إجابة صحيحة</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            <span>إجابة خاطئة</span>
                          </>
                        )}
                      </span>
                    </div>
                    <p className="font-display font-bold text-[#0F172A]">{q.question}</p>
                    <p className="text-sm text-emerald-800 font-medium">
                      الإجابة الصحيحة: {q.options[q.correctIndex]}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{q.explanation}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const progressPct = Math.round(((currentIdx + (hasAnsweredCurrent ? 1 : 0)) / totalQuestions) * 100);

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onSelectQuiz(null)}
            className="min-h-[44px] px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-display font-bold text-[#0F172A] hover:bg-slate-50 flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>خروج من الاختبار</span>
          </button>

          <div className="flex items-center gap-3 text-sm font-display font-bold text-[#0F172A] tabular-nums">
            <span className="inline-flex items-center gap-1 text-slate-600">
              <Clock className="w-4 h-4 text-[#17B8A6]" />
              <span>{formatDuration(elapsedSeconds)}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              سؤال {currentIdx + 1} من {totalQuestions}
            </span>
          </div>
        </div>

        <div className="h-2.5 bg-[#E8E8E8] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #FFD93D, #FF5A7A)',
            }}
          />
        </div>

        <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm p-5 sm:p-7 space-y-5">
          <div className="text-xs font-display font-bold text-[#17B8A6]">{activeQuiz.title}</div>

          <h2 className="font-display text-lg sm:text-xl font-black text-[#0F172A] leading-relaxed">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3" role="radiogroup" aria-label={currentQuestion.question}>
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectOption = idx === currentQuestion.correctIndex;

              let buttonStyle =
                'bg-[#F1F1F1] border-transparent text-[#0F172A] hover:bg-[#EAECEF]';
              if (hasAnsweredCurrent) {
                if (isCorrectOption) {
                  buttonStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold';
                } else if (isSelected && !isCorrectOption) {
                  buttonStyle = 'bg-rose-50 border-rose-500 text-rose-950';
                } else {
                  buttonStyle = 'bg-slate-50 border-slate-200 text-slate-500 opacity-75';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={hasAnsweredCurrent}
                  onClick={() => handleChooseOption(idx)}
                  className={`w-full min-h-[52px] text-right px-4 py-3.5 rounded-xl border-2 text-sm sm:text-base transition-all flex items-center justify-between gap-3 ${buttonStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center font-display font-bold text-xs shrink-0 tabular-nums">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </div>

                  {hasAnsweredCurrent && isCorrectOption && (
                    <span className="inline-flex items-center gap-1 text-xs font-display font-bold text-emerald-700 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="hidden sm:inline">صحيح</span>
                    </span>
                  )}

                  {hasAnsweredCurrent && isSelected && !isCorrectOption && (
                    <span className="inline-flex items-center gap-1 text-xs font-display font-bold text-rose-700 shrink-0">
                      <XCircle className="w-5 h-5" />
                      <span className="hidden sm:inline">خطأ</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {hasAnsweredCurrent && (
            <div
              className={`p-4 rounded-2xl border space-y-1.5 ${
                isCurrentCorrect
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/70 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-2 font-display font-bold text-sm">
                {isCurrentCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>إجابة صحيحة!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-700" />
                    <span>إجابة غير صحيحة</span>
                  </>
                )}
              </div>
              <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {hasAnsweredCurrent && (
            <button
              type="button"
              onClick={handleNextOrFinish}
              className="w-full min-h-[48px] py-3 px-6 rounded-full text-white font-display font-black text-base shadow-sm hover:opacity-95 transition-opacity"
              style={{ background: 'linear-gradient(90deg, #0F172A, #FF5A7A)' }}
            >
              {currentIdx < totalQuestions - 1 ? 'السؤال التالي' : 'إنهاء وعرض النتيجة'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const displayedQuizzes =
    filterMode === 'all'
      ? quizzes
      : quizzes.filter((q) => q.subjectId === selectedSubjectId);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilterMode('all')}
          className={`min-h-[44px] px-4 py-2 rounded-full font-display font-extrabold text-sm whitespace-nowrap shrink-0 transition-colors ${
            filterMode === 'all'
              ? 'bg-[#0F172A] text-white'
              : 'bg-[#EDEDEF] text-[#1A2E3A] hover:bg-[#E2E4E8]'
          }`}
        >
          كل المواد ({quizzes.length})
        </button>

        {subjects.map((subject) => {
          const isActive = filterMode === 'active-subject' && subject.id === selectedSubjectId;
          return (
            <button
              key={subject.id}
              type="button"
              onClick={() => {
                onSelectSubject(subject.id);
                setFilterMode('active-subject');
              }}
              className={`min-h-[44px] px-4 py-2 rounded-full font-display font-extrabold text-sm whitespace-nowrap shrink-0 transition-colors inline-flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-[#EDEDEF] text-[#1A2E3A] hover:bg-[#E2E4E8]'
              }`}
            >
              <span aria-hidden="true">{subject.emoji}</span>
              <span>{subject.name}</span>
            </button>
          );
        })}
      </div>

      <div>
        <h2 className="font-display text-2xl font-black text-[#0F172A]">الاختبارات الشاملة</h2>
        <p className="text-sm text-slate-600 mt-0.5">
          اختر اختبار أي مادة أو اختبر نفسك مباشرة داخل كل درس
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedQuizzes.map((quiz) => {
          const subject = subjects.find((s) => s.id === quiz.subjectId);
          const attempt = progress.quizAttempts[quiz.id];

          return (
            <div
              key={quiz.id}
              className="bg-white rounded-[22px] p-5 flex flex-col justify-between gap-4 shadow-sm border border-slate-200/80"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5 font-display font-bold text-[#0F172A]">
                    <span aria-hidden="true">{subject?.emoji}</span>
                    <span>{subject?.name}</span>
                  </span>
                  {attempt ? (
                    <span className="inline-flex items-center gap-1 font-display font-bold text-[#17B8A6] tabular-nums">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        أفضل نتيجة: {attempt.score} / {attempt.total}
                      </span>
                    </span>
                  ) : (
                    <span className="font-display font-bold text-[#FF5A7A] tabular-nums">
                      +{quiz.pointsReward} نقطة
                    </span>
                  )}
                </div>

                <h3 className="font-display text-lg font-black text-[#0F172A] leading-snug">
                  {quiz.title}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">{quiz.description}</p>

                <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums pt-1">
                  <span className="inline-flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-[#17B8A6]" />
                    <span>{quiz.questions.length} أسئلة</span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#FF5A7A]" />
                    <span>{quiz.durationMinutes} دقيقة</span>
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => onSelectQuiz(quiz)}
                  className="w-full min-h-[46px] py-2.5 px-4 rounded-full text-white font-display font-bold text-sm shadow-xs hover:opacity-95 transition-opacity"
                  style={{ background: 'linear-gradient(90deg, #0F172A, #FF5A7A)' }}
                >
                  {attempt ? 'إعادة الاختبار' : 'ابدأ الاختبار الآن'}
                </button>

                <button
                  type="button"
                  onClick={() => onOpenLesson(quiz.lessonId)}
                  className="w-full min-h-[40px] py-2 px-4 rounded-full text-xs font-display font-bold text-[#0F172A] hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#17B8A6]" />
                  <span>مراجعة أول درس في المادة</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
