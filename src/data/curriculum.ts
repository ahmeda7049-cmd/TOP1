import { AppNotification, Lesson, Quiz, StudentProgress, Subject, SubjectId, Unit } from '../types';
import { ARABIC_DEEN_LESSONS, ARABIC_DEEN_UNITS } from './arabicAndDeen';
import { STEM_LESSONS, STEM_UNITS } from './stemSubjects';
import { HUMANITIES_ENGLISH_LESSONS, HUMANITIES_ENGLISH_UNITS } from './humanitiesAndEnglish';

export const SUBJECTS: Subject[] = [
  {
    id: 'arabic',
    name: 'عربي',
    emoji: '📖',
    color: '#2EC4B6',
    bg: '#E0F7F5',
    desc: '8 دروس · نحو ونصوص وأدب',
  },
  {
    id: 'math',
    name: 'رياضيات',
    emoji: '➗',
    color: '#4361EE',
    bg: '#E7EBFF',
    desc: '9 دروس · جبر وهندسة ومثلثات',
  },
  {
    id: 'science',
    name: 'علوم متكاملة',
    emoji: '🔬',
    color: '#FF5A7A',
    bg: '#FFE4EC',
    desc: '11 درس · كل العلوم في مادة واحدة',
  },
  {
    id: 'deen',
    name: 'دين',
    emoji: '🕌',
    color: '#2A9D8F',
    bg: '#D8F3EF',
    desc: '10 دروس · عقيدة وعبادات وأخلاق',
  },
  {
    id: 'coding',
    name: 'برمجة',
    emoji: '💻',
    color: '#7209B7',
    bg: '#F0D9FF',
    desc: '9 دروس · بايثون ومشاريع',
  },
  {
    id: 'english',
    name: 'إنجليزي',
    emoji: '🌍',
    color: '#F77F00',
    bg: '#FFF0DB',
    desc: '9 دروس · قواعد ومفردات وقراءة',
  },
  {
    id: 'history',
    name: 'تاريخ',
    emoji: '🏛️',
    color: '#E63946',
    bg: '#FFE5E8',
    desc: '9 دروس · الحضارة ومصر القديمة',
  },
];

export const UNITS: Unit[] = [
  ...ARABIC_DEEN_UNITS,
  ...STEM_UNITS,
  ...HUMANITIES_ENGLISH_UNITS,
];

export const LESSONS: Lesson[] = [
  ...ARABIC_DEEN_LESSONS,
  ...STEM_LESSONS,
  ...HUMANITIES_ENGLISH_LESSONS,
];

// Build comprehensive subject exams (combining questions from each subject's lessons)
export const QUIZZES: Quiz[] = SUBJECTS.map((subject) => {
  const subjectLessons = LESSONS.filter((l) => l.subjectId === subject.id);
  const combinedQuestions = subjectLessons.flatMap((l) => l.questions.slice(0, 2)).slice(0, 10);
  const firstLesson = subjectLessons[0];
  return {
    id: `quiz-${subject.id}`,
    subjectId: subject.id,
    unitId: firstLesson.unitId,
    lessonId: firstLesson.id,
    title: `اختبار شامل: ${subject.name}`,
    description: `تحدي ${combinedQuestions.length} أسئلة شاملة على دروس مادة ${subject.name} مع تصحيح وتفسير فوري.`,
    durationMinutes: Math.max(8, combinedQuestions.length),
    pointsReward: 50,
    questions: combinedQuestions,
  };
});

export const INITIAL_PROGRESS: StudentProgress = {
  studentName: 'أحمد محمد',
  avatarEmoji: '🧑‍🎓',
  points: 0,
  streakDays: 1,
  lastCheckInDate: null,
  completedChallengeDate: null,
  completedLessonIds: [],
  quizAttempts: {},
  readNotificationIds: [],
};

export function getTodayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildDailyChallengeQuiz(): Quiz {
  const today = getTodayKey();
  // Pick 5 diverse questions across subjects deterministically for today
  const seed = today
    .split('-')
    .reduce((acc, part) => acc + Number(part), 0);
  const pickedQuestions = SUBJECTS.slice(0, 5).map((sub, i) => {
    const subLessons = LESSONS.filter((l) => l.subjectId === sub.id);
    const lesson = subLessons[(seed + i) % subLessons.length];
    return lesson.questions[0];
  });

  return {
    id: `daily-challenge-${today}`,
    subjectId: 'arabic',
    unitId: 'ar-u1',
    lessonId: 'ar-1',
    title: 'تحدي اليوم السريع ⚡ (5 أسئلة متنوعة)',
    description: 'تحدٍ يومي من 5 مواد مختلفة — أجب عليها لترفع نقاطك وتتصدر قائمة TOP1.',
    durationMinutes: 5,
    pointsReward: 60,
    questions: pickedQuestions,
  };
}

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'ابدأ رحلتك نحو TOP1',
    body: 'اختر مادة من الشاشة الرئيسية وذاكر أول درس: مكارم الأخلاق وحاتم الطائي.',
    timeLabel: 'الآن',
    subjectId: 'arabic',
    targetTab: 'lessons',
    targetLessonId: 'ar-1',
  },
  {
    id: 'n2',
    title: 'منهج 65 درساً كاملاً',
    body: 'جميع دروس الـ 7 مواد (عربي، رياضيات، علوم متكاملة، دين، برمجة، إنجليزي، تاريخ) متاحة مع اختبارات فورية.',
    timeLabel: 'اليوم',
    subjectId: 'coding',
    targetTab: 'quizzes',
    targetQuizId: 'quiz-coding',
  },
];

export function getLevelTitle(pct: number, points: number): string {
  if (pct >= 85 || points >= 700) return 'أسطورة TOP1 🏆';
  if (pct >= 50 || points >= 350) return 'نجم الصف ⭐';
  if (pct >= 20 || points >= 100) return 'مجتهد 🔥';
  if (points > 0) return 'منطلق بقوة 🚀';
  return 'لسه بتبدأ 🌱';
}

export function calculateUnitProgress(unitId: string, completedLessonIds: string[]): number {
  const unitLessons = LESSONS.filter((l) => l.unitId === unitId);
  if (unitLessons.length === 0) return 0;
  const completedCount = unitLessons.filter((l) => completedLessonIds.includes(l.id)).length;
  return Math.round((completedCount / unitLessons.length) * 100);
}

export function calculateSubjectProgress(
  subjectId: SubjectId,
  completedLessonIds: string[]
): number {
  const subjectLessons = LESSONS.filter((l) => l.subjectId === subjectId);
  if (subjectLessons.length === 0) return 0;
  const completedCount = subjectLessons.filter((l) => completedLessonIds.includes(l.id)).length;
  return Math.round((completedCount / subjectLessons.length) * 100);
}

export function calculateOverallProgress(progress: StudentProgress): number {
  const completedLessons = LESSONS.filter((l) => progress.completedLessonIds.includes(l.id)).length;
  return Math.round((completedLessons / LESSONS.length) * 100);
}
