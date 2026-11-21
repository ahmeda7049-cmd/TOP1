export type TabId = 'home' | 'lessons' | 'quizzes' | 'friends' | 'profile';

export type SubjectId =
  | 'arabic'
  | 'math'
  | 'science'
  | 'deen'
  | 'coding'
  | 'english'
  | 'history';

export interface Subject {
  id: SubjectId;
  name: string;
  emoji: string;
  color: string;
  bg: string;
  desc: string;
}

export interface VocabularyItem {
  word: string;
  meaning: string;
  opposite?: string;
}

export interface RhetoricOrRuleItem {
  title: string;
  detail: string;
  example: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  subjectId: SubjectId;
  unitId: string;
  title: string;
  branch: string;
  durationMinutes: number;
  summary: string;
  passageTitle: string;
  passageLines: string[];
  keyTakeaways: string[];
  vocabulary: VocabularyItem[];
  rules: RhetoricOrRuleItem[];
  imageUrl?: string;
  pointsReward: number;
  questions: QuizQuestion[];
}

export interface Unit {
  id: string;
  subjectId: SubjectId;
  title: string;
}

export interface Quiz {
  id: string;
  subjectId: SubjectId;
  unitId: string;
  lessonId: string;
  title: string;
  description: string;
  durationMinutes: number;
  pointsReward: number;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  quizId: string;
  score: number;
  total: number;
  completedAt: string;
}

export interface StudentProgress {
  studentName: string;
  avatarEmoji: string;
  points: number;
  streakDays: number;
  lastCheckInDate: string | null;
  completedChallengeDate: string | null;
  completedLessonIds: string[];
  quizAttempts: Record<string, QuizAttempt>;
  readNotificationIds: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timeLabel: string;
  subjectId?: SubjectId;
  targetTab: TabId;
  targetQuizId?: string;
  targetLessonId?: string;
}

export interface PublicProfile {
  uid: string;
  displayName: string;
  avatarEmoji: string;
  friendCode: string;
  points: number;
  streakDays: number;
  completedCount: number;
}

export interface FriendLink {
  ownerUid: string;
  friendUid: string;
  friendCode: string;
  displayName: string;
  avatarEmoji: string;
}

export type MessageType = 'text' | 'challenge' | 'score_reply';

export interface FriendChat {
  chatId: string;
  participants: string[];
  p1Name: string;
  p2Name: string;
  p1Avatar: string;
  p2Avatar: string;
  lastMessageText: string;
  lastMessageType: MessageType;
  lastSenderUid: string;
  updatedAtMs: number;
}

export interface ChatMessage {
  id: string;
  senderUid: string;
  senderName: string;
  senderAvatar: string;
  participants: string[];
  type: MessageType;
  text: string;
  quizId?: string;
  quizTitle?: string;
  subjectId?: SubjectId;
  score?: number;
  total?: number;
  createdAtMs: number;
}

export interface ChallengeReplyTarget {
  friendUid: string;
  friendName: string;
  friendAvatar: string;
  friendCode: string;
}
