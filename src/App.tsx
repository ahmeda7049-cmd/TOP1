import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  SUBJECTS,
  UNITS,
  LESSONS,
  QUIZZES,
  NOTIFICATIONS,
  INITIAL_PROGRESS,
  getTodayKey,
  buildDailyChallengeQuiz,
} from './data/curriculum';
import {
  AppNotification,
  ChallengeReplyTarget,
  FriendChat,
  FriendLink,
  Lesson,
  PublicProfile,
  Quiz,
  StudentProgress,
  SubjectId,
  TabId,
} from './types';
import { auth, googleProvider } from './firebase';
import {
  ensureUserProvisioned,
  sendFriendMessage,
  subscribeToFriends,
  subscribeToMyChats,
  subscribeToProfile,
  syncProfileStats,
} from './services/friendsService';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { LessonsView } from './components/LessonsView';
import { QuizzesView } from './components/QuizzesView';
import { FriendsView } from './components/FriendsView';
import { ProfileView } from './components/ProfileView';
import { OfflineIndicator } from './components/OfflineIndicator';

const STORAGE_KEY = 'top1_grade10_7subjects_v3';

function loadSavedProgress(): StudentProgress {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<StudentProgress>;
    return {
      studentName: parsed.studentName || INITIAL_PROGRESS.studentName,
      avatarEmoji: parsed.avatarEmoji || INITIAL_PROGRESS.avatarEmoji,
      points: typeof parsed.points === 'number' ? parsed.points : INITIAL_PROGRESS.points,
      streakDays: typeof parsed.streakDays === 'number' ? parsed.streakDays : INITIAL_PROGRESS.streakDays,
      lastCheckInDate: parsed.lastCheckInDate || null,
      completedChallengeDate: parsed.completedChallengeDate || null,
      completedLessonIds: Array.isArray(parsed.completedLessonIds)
        ? parsed.completedLessonIds
        : INITIAL_PROGRESS.completedLessonIds,
      quizAttempts:
        parsed.quizAttempts && typeof parsed.quizAttempts === 'object'
          ? parsed.quizAttempts
          : INITIAL_PROGRESS.quizAttempts,
      readNotificationIds: Array.isArray(parsed.readNotificationIds)
        ? parsed.readNotificationIds
        : INITIAL_PROGRESS.readNotificationIds,
    };
  } catch {
    return INITIAL_PROGRESS;
  }
}

function readInitialInviteCode(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('addFriend');
    return code ? code.trim().toUpperCase() : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [progress, setProgress] = useState<StudentProgress>(loadSavedProgress);
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(readInitialInviteCode);
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    readInitialInviteCode() ? 'friends' : 'home'
  );
  const [homeSubjectId, setHomeSubjectId] = useState<SubjectId | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<SubjectId>('arabic');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string | 'all'>('all');
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [challengeTarget, setChallengeTarget] = useState<ChallengeReplyTarget | null>(null);

  // Firebase Auth & Social Sync State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [myFriendCode, setMyFriendCode] = useState<string>('');
  const [friends, setFriends] = useState<FriendLink[]>([]);
  const [chats, setChats] = useState<FriendChat[]>([]);
  const [friendProfiles, setFriendProfiles] = useState<Record<string, PublicProfile>>({});

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage quota errors
    }
  }, [progress]);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
      if (!user) {
        setMyFriendCode('');
        setFriends([]);
        setChats([]);
        setFriendProfiles({});
      }
    });
    return () => unsub();
  }, []);

  // Provision Firestore user doc, public profile & friend code on sign-in
  useEffect(() => {
    if (!firebaseUser) return;
    let cancelled = false;
    const init = async () => {
      const displayName =
        progress.studentName === INITIAL_PROGRESS.studentName && firebaseUser.displayName
          ? firebaseUser.displayName.slice(0, 40)
          : progress.studentName;

      if (displayName !== progress.studentName) {
        setProgress((prev) => ({ ...prev, studentName: displayName }));
      }

      const code = await ensureUserProvisioned(
        firebaseUser,
        displayName,
        progress.avatarEmoji,
        progress.points,
        progress.streakDays,
        progress.completedLessonIds.length
      );
      if (!cancelled) {
        setMyFriendCode(code);
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
    // Only run provisioning when firebaseUser UID changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser?.uid]);

  // Sync student score/profile updates to Firestore while signed in
  useEffect(() => {
    if (!firebaseUser || !myFriendCode) return;
    void syncProfileStats(
      firebaseUser.uid,
      myFriendCode,
      progress.studentName,
      progress.avatarEmoji,
      progress.points,
      progress.streakDays,
      progress.completedLessonIds.length
    );
  }, [
    firebaseUser,
    myFriendCode,
    progress.studentName,
    progress.avatarEmoji,
    progress.points,
    progress.streakDays,
    progress.completedLessonIds.length,
  ]);

  // Subscribe to friends list & chats once authenticated
  useEffect(() => {
    if (!firebaseUser) return;
    const unsubFriends = subscribeToFriends(firebaseUser.uid, setFriends);
    const unsubChats = subscribeToMyChats(firebaseUser.uid, setChats);
    return () => {
      unsubFriends();
      unsubChats();
    };
  }, [firebaseUser]);

  // Subscribe to each friend's live public profile (for points & leaderboard)
  const friendUidsKey = Array.from(
    new Set([
      ...friends.map((f) => f.friendUid),
      ...chats.flatMap((c) => c.participants.filter((id) => id !== firebaseUser?.uid)),
    ])
  )
    .sort()
    .join(',');

  useEffect(() => {
    if (!firebaseUser || !friendUidsKey) {
      setFriendProfiles({});
      return;
    }
    const uids = friendUidsKey.split(',').filter(Boolean);
    const unsubs = uids.map((uid) =>
      subscribeToProfile(uid, (profile) => {
        setFriendProfiles((prev) => ({
          ...prev,
          [uid]: profile,
        }));
      })
    );
    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [firebaseUser, friendUidsKey]);

  const handleSignInGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setAuthError('تعذّر إتمام تسجيل الدخول بجوجل، تأكد من السماح بالنوافذ المنبثقة وحاول مجدداً.');
    }
  };

  const handleSignOutGoogle = async () => {
    await signOut(auth);
  };

  const handleClearPendingInvite = useCallback(() => {
    setPendingInviteCode(null);
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('addFriend')) {
        url.searchParams.delete('addFriend');
        window.history.replaceState({}, '', url.pathname + url.search);
      }
    } catch {
      // Ignore URL cleanup errors
    }
  }, []);

  const handleSelectTab = (tab: TabId) => {
    setActiveTab(tab);
    if (tab === 'home') {
      setHomeSubjectId(null);
    }
    if (tab !== 'lessons') {
      setActiveLessonId(null);
    }
    if (tab !== 'quizzes') {
      setActiveQuiz(null);
      setChallengeTarget(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSubjectPage = (subjectId: SubjectId | null) => {
    setHomeSubjectId(subjectId);
    if (subjectId) {
      setSelectedSubjectId(subjectId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSubject = (subjectId: SubjectId) => {
    setSelectedSubjectId(subjectId);
    setSelectedUnitFilter('all');
    setActiveLessonId(null);
  };

  const handleStudyLesson = (lessonId: string) => {
    const lesson = LESSONS.find((l) => l.id === lessonId);
    if (lesson) {
      setSelectedSubjectId(lesson.subjectId);
      setSelectedUnitFilter(lesson.unitId);
    }
    setActiveLessonId(lessonId);
    setActiveTab('lessons');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuizLesson = (lesson: Lesson) => {
    setSelectedSubjectId(lesson.subjectId);
    const lessonQuiz: Quiz = {
      id: `lesson-quiz-${lesson.id}`,
      subjectId: lesson.subjectId,
      unitId: lesson.unitId,
      lessonId: lesson.id,
      title: `اختبار سريع: ${lesson.title}`,
      description: lesson.summary,
      durationMinutes: 5,
      pointsReward: lesson.pointsReward,
      questions: lesson.questions,
    };
    setChallengeTarget(null);
    setActiveQuiz(lessonQuiz);
    setActiveTab('quizzes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDailyCheckIn = () => {
    const today = getTodayKey();
    setProgress((prev) => {
      if (prev.lastCheckInDate === today) return prev;
      const hadPreviousCheckIn = Boolean(prev.lastCheckInDate);
      return {
        ...prev,
        points: prev.points + 15,
        streakDays: hadPreviousCheckIn ? prev.streakDays + 1 : Math.max(1, prev.streakDays),
        lastCheckInDate: today,
      };
    });
  };

  const handleStartDailyChallenge = () => {
    const dailyQuiz = buildDailyChallengeQuiz();
    setChallengeTarget(null);
    setActiveQuiz(dailyQuiz);
    setActiveTab('quizzes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartFeaturedQuiz = () => {
    const targetSubject = homeSubjectId || selectedSubjectId;
    const quiz = QUIZZES.find((q) => q.subjectId === targetSubject) || QUIZZES[0];
    setChallengeTarget(null);
    setActiveQuiz(quiz);
    setActiveTab('quizzes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAcceptChallenge = (quiz: Quiz, target: ChallengeReplyTarget) => {
    setSelectedSubjectId(quiz.subjectId);
    setChallengeTarget(target);
    setActiveQuiz(quiz);
    setActiveTab('quizzes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendScoreToFriend = async (
    quiz: Quiz,
    score: number,
    total: number,
    target: ChallengeReplyTarget
  ) => {
    if (!firebaseUser) return;
    await sendFriendMessage({
      myUid: firebaseUser.uid,
      myName: progress.studentName,
      myAvatar: progress.avatarEmoji,
      friendUid: target.friendUid,
      friendName: target.friendName,
      friendAvatar: target.friendAvatar,
      type: 'score_reply',
      text: `خلصت تحدي "${quiz.title}" وجبت ${score} من ${total}! دورك توريني شطارتك 🏆`,
      quizId: quiz.id,
      quizTitle: quiz.title,
      subjectId: quiz.subjectId,
      score,
      total,
    });
  };

  const handleToggleLessonComplete = (lesson: Lesson) => {
    setProgress((prev) => {
      const alreadyDone = prev.completedLessonIds.includes(lesson.id);
      if (alreadyDone) {
        return {
          ...prev,
          completedLessonIds: prev.completedLessonIds.filter((id) => id !== lesson.id),
          points: Math.max(0, prev.points - lesson.pointsReward),
        };
      }
      return {
        ...prev,
        completedLessonIds: [...prev.completedLessonIds, lesson.id],
        points: prev.points + lesson.pointsReward,
      };
    });
  };

  const handleCompleteQuiz = (quiz: Quiz, score: number): number => {
    const total = quiz.questions.length;
    const isPassing = score >= Math.ceil(total * 0.5);
    const prevAttempt = progress.quizAttempts[quiz.id];
    const isDailyChallenge = quiz.id.startsWith('daily-challenge-');
    const today = getTodayKey();

    let earned = 0;
    if (!prevAttempt) {
      earned = Math.round((score / total) * quiz.pointsReward);
    } else if (score > prevAttempt.score) {
      const prevEarned = Math.round((prevAttempt.score / total) * quiz.pointsReward);
      const newEarned = Math.round((score / total) * quiz.pointsReward);
      earned = Math.max(0, newEarned - prevEarned);
    }

    setProgress((prev) => {
      const bestScore = prevAttempt ? Math.max(prevAttempt.score, score) : score;
      const shouldCompleteLesson =
        !isDailyChallenge && isPassing && !prev.completedLessonIds.includes(quiz.lessonId);
      const linkedLesson = LESSONS.find((l) => l.id === quiz.lessonId);
      const lessonBonus = shouldCompleteLesson && linkedLesson ? linkedLesson.pointsReward : 0;

      return {
        ...prev,
        points: prev.points + earned + lessonBonus,
        completedChallengeDate: isDailyChallenge ? today : prev.completedChallengeDate,
        completedLessonIds: shouldCompleteLesson
          ? [...prev.completedLessonIds, quiz.lessonId]
          : prev.completedLessonIds,
        quizAttempts: {
          ...prev.quizAttempts,
          [quiz.id]: {
            quizId: quiz.id,
            score: bestScore,
            total,
            completedAt: new Date().toISOString(),
          },
        },
      };
    });

    return earned;
  };

  const handleMarkNotificationRead = (id: string) => {
    setProgress((prev) => {
      if (prev.readNotificationIds.includes(id)) return prev;
      return {
        ...prev,
        readNotificationIds: [...prev.readNotificationIds, id],
      };
    });
  };

  const handleNotificationNavigate = (n: AppNotification) => {
    if (n.subjectId) {
      setSelectedSubjectId(n.subjectId);
    }
    if (n.targetQuizId) {
      const found = QUIZZES.find((q) => q.id === n.targetQuizId) || null;
      setActiveQuiz(found);
      setActiveTab('quizzes');
    } else if (n.targetLessonId) {
      handleStudyLesson(n.targetLessonId);
    } else {
      handleSelectTab(n.targetTab);
    }
  };

  const handleUpdateProfile = (studentName: string, avatarEmoji: string) => {
    setProgress((prev) => ({
      ...prev,
      studentName,
      avatarEmoji,
    }));
  };

  const handleResetProgress = () => {
    setProgress(INITIAL_PROGRESS);
    setActiveLessonId(null);
    setActiveQuiz(null);
    setChallengeTarget(null);
    setHomeSubjectId(null);
    setSelectedUnitFilter('all');
    setSelectedSubjectId('arabic');
    setActiveTab('home');
  };

  return (
    <div className="min-h-screen bg-[#FFF9FA] text-[#0F172A] pb-24 lg:pb-12">
      <TopBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        avatarEmoji={progress.avatarEmoji}
        points={progress.points}
        notifications={NOTIFICATIONS}
        readNotificationIds={progress.readNotificationIds}
        onMarkNotificationRead={handleMarkNotificationRead}
        onNotificationNavigate={handleNotificationNavigate}
        onStartFeaturedQuiz={handleStartFeaturedQuiz}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-3 sm:pt-5">
        {activeTab === 'home' && (
          <HomeView
            subjects={SUBJECTS}
            activeSubjectId={homeSubjectId}
            onSelectSubjectPage={handleSelectSubjectPage}
            units={UNITS}
            lessons={LESSONS}
            progress={progress}
            myFriendCode={myFriendCode}
            onStudyLesson={handleStudyLesson}
            onQuizLesson={handleQuizLesson}
            onDailyCheckIn={handleDailyCheckIn}
            onStartDailyChallenge={handleStartDailyChallenge}
            onOpenFriends={() => handleSelectTab('friends')}
          />
        )}

        {activeTab === 'lessons' && (
          <LessonsView
            subjects={SUBJECTS}
            selectedSubjectId={selectedSubjectId}
            onSelectSubject={handleSelectSubject}
            units={UNITS}
            lessons={LESSONS}
            progress={progress}
            selectedUnitId={selectedUnitFilter}
            onSelectUnitFilter={setSelectedUnitFilter}
            activeLessonId={activeLessonId}
            onSelectLesson={setActiveLessonId}
            onToggleLessonComplete={handleToggleLessonComplete}
            onQuizLesson={handleQuizLesson}
          />
        )}

        {activeTab === 'quizzes' && (
          <QuizzesView
            subjects={SUBJECTS}
            selectedSubjectId={selectedSubjectId}
            onSelectSubject={handleSelectSubject}
            quizzes={QUIZZES}
            progress={progress}
            activeQuiz={activeQuiz}
            onSelectQuiz={setActiveQuiz}
            onCompleteQuiz={handleCompleteQuiz}
            onOpenLesson={handleStudyLesson}
            onBackHome={() => handleSelectTab('home')}
            challengeTarget={challengeTarget}
            onSendScoreToFriend={firebaseUser ? handleSendScoreToFriend : undefined}
          />
        )}

        {activeTab === 'friends' && (
          <FriendsView
            firebaseUser={firebaseUser}
            authLoading={authLoading}
            authError={authError}
            myFriendCode={myFriendCode}
            myName={progress.studentName}
            myAvatar={progress.avatarEmoji}
            friends={friends}
            chats={chats}
            friendProfiles={friendProfiles}
            pendingInviteCode={pendingInviteCode}
            onClearPendingInvite={handleClearPendingInvite}
            onSignInGoogle={handleSignInGoogle}
            onSignOutGoogle={handleSignOutGoogle}
            onAcceptChallenge={handleAcceptChallenge}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            subjects={SUBJECTS}
            lessons={LESSONS}
            quizzes={QUIZZES}
            progress={progress}
            myFriendCode={myFriendCode}
            onUpdateProfile={handleUpdateProfile}
            onResetProgress={handleResetProgress}
          />
        )}
      </main>

      <OfflineIndicator />
      <BottomNav activeTab={activeTab} onSelectTab={handleSelectTab} />
    </div>
  );
}
