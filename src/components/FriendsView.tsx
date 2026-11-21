import React, { useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  Send,
  UserPlus,
  Copy,
  Check,
  Zap,
  MessageCircle,
  Trophy,
  ArrowRight,
  LogIn,
  LogOut,
  Share2,
  Trash2,
} from 'lucide-react';
import type {
  ChallengeReplyTarget,
  ChatMessage,
  FriendChat,
  FriendLink,
  PublicProfile,
  Quiz,
  Subject,
} from '../types';
import { QUIZZES, SUBJECTS, buildDailyChallengeQuiz } from '../data/curriculum';
import { addFriendByCode, getChatId, removeFriend, sendFriendMessage, subscribeToChatMessages } from '../services/friendsService';
import { PWAInstallButton, buildShareUrl } from './PWAInstallButton';

interface FriendsViewProps {
  firebaseUser: User | null;
  authLoading: boolean;
  authError: string | null;
  myFriendCode: string;
  myName: string;
  myAvatar: string;
  friends: FriendLink[];
  chats: FriendChat[];
  friendProfiles: Record<string, PublicProfile>;
  pendingInviteCode: string | null;
  onClearPendingInvite: () => void;
  onSignInGoogle: () => Promise<void>;
  onSignOutGoogle: () => Promise<void>;
  onAcceptChallenge: (quiz: Quiz, replyTarget: ChallengeReplyTarget) => void;
}

interface ConversationContact {
  uid: string;
  name: string;
  avatar: string;
  friendCode: string;
  isAddedFriend: boolean;
  lastMessageText?: string;
  updatedAtMs?: number;
}

const QUICK_MESSAGES = ['يلا نذاكر سوا! 💪', 'خلصت درس جديد 🔥', 'جاهز لتحدي اختبار؟ ⚡'];

export const FriendsView: React.FC<FriendsViewProps> = ({
  firebaseUser,
  authLoading,
  authError,
  myFriendCode,
  myName,
  myAvatar,
  friends,
  chats,
  friendProfiles,
  pendingInviteCode,
  onClearPendingInvite,
  onSignInGoogle,
  onSignOutGoogle,
  onAcceptChallenge,
}) => {
  const [codeInput, setCodeInput] = useState('');
  const [addStatus, setAddStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [addingFriend, setAddingFriend] = useState(false);

  const [selectedContactUid, setSelectedContactUid] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showChallengePicker, setShowChallengePicker] = useState(false);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Merge explicitly added friends and active incoming/outgoing chat participants
  const contacts: ConversationContact[] = React.useMemo(() => {
    if (!firebaseUser) return [];
    const map = new Map<string, ConversationContact>();

    for (const f of friends) {
      const live = friendProfiles[f.friendUid];
      map.set(f.friendUid, {
        uid: f.friendUid,
        name: live?.displayName || f.displayName,
        avatar: live?.avatarEmoji || f.avatarEmoji,
        friendCode: live?.friendCode || f.friendCode,
        isAddedFriend: true,
      });
    }

    for (const c of chats) {
      const otherUid = c.participants.find((id) => id !== firebaseUser.uid);
      if (!otherUid) continue;
      const isP1Other = c.participants[0] === otherUid;
      const fallbackName = isP1Other ? c.p1Name : c.p2Name;
      const fallbackAvatar = isP1Other ? c.p1Avatar : c.p2Avatar;
      const live = friendProfiles[otherUid];
      const existing = map.get(otherUid);
      map.set(otherUid, {
        uid: otherUid,
        name: live?.displayName || existing?.name || fallbackName,
        avatar: live?.avatarEmoji || existing?.avatar || fallbackAvatar,
        friendCode: live?.friendCode || existing?.friendCode || '',
        isAddedFriend: existing?.isAddedFriend ?? false,
        lastMessageText: c.lastMessageText,
        updatedAtMs: c.updatedAtMs,
      });
    }

    return Array.from(map.values()).sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0));
  }, [firebaseUser, friends, chats, friendProfiles]);

  const selectedContact = contacts.find((c) => c.uid === selectedContactUid) || null;

  // Auto-select first contact on desktop if none selected
  useEffect(() => {
    if (!selectedContactUid && contacts.length > 0 && window.innerWidth >= 1024) {
      setSelectedContactUid(contacts[0].uid);
    }
  }, [contacts, selectedContactUid]);

  // Handle pending invite link (?addFriend=CODE) once user is provisioned
  useEffect(() => {
    if (!firebaseUser || !myFriendCode || !pendingInviteCode) return;
    let cancelled = false;
    const run = async () => {
      setAddingFriend(true);
      try {
        const res = await addFriendByCode(firebaseUser.uid, myFriendCode, pendingInviteCode);
        if (cancelled) return;
        if (res.ok) {
          setAddStatus({ type: 'ok', text: `تمت إضافة ${res.friend.displayName} من رابط الدعوة!` });
          setSelectedContactUid(res.friend.friendUid);
        } else if (res.reason === 'not_found') {
          setAddStatus({ type: 'err', text: 'كود الدعوة غير مسجل حتى الآن.' });
        }
      } finally {
        if (!cancelled) {
          setAddingFriend(false);
          onClearPendingInvite();
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [firebaseUser, myFriendCode, pendingInviteCode, onClearPendingInvite]);

  // Subscribe to messages for active chat
  useEffect(() => {
    if (!firebaseUser || !selectedContact) {
      setMessages([]);
      return;
    }
    const chatId = getChatId(firebaseUser.uid, selectedContact.uid);
    const hasChat = chats.some((c) => c.chatId === chatId);
    if (!hasChat) {
      setMessages([]);
      return;
    }
    const unsub = subscribeToChatMessages(chatId, firebaseUser.uid, (msgs) => {
      setMessages(msgs);
    });
    return () => unsub();
  }, [firebaseUser, selectedContact?.uid, chats]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleCopyCode = async () => {
    if (!myFriendCode) return;
    try {
      await navigator.clipboard.writeText(myFriendCode);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleShareInviteLink = async () => {
    const url = buildShareUrl(myFriendCode);
    const text = `انضم معي في تطبيق TOP1 لأولى ثانوي! كود صداقتي: ${myFriendCode}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'دعوة TOP1', text, url });
        return;
      } catch {
        // Fallback to copy
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopiedInvite(true);
      window.setTimeout(() => setCopiedInvite(false), 2500);
    } catch {
      // Ignore
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !myFriendCode) return;
    setAddStatus(null);
    setAddingFriend(true);
    try {
      const res = await addFriendByCode(firebaseUser.uid, myFriendCode, codeInput);
      if (res.ok) {
        setAddStatus({ type: 'ok', text: `تمت إضافة ${res.friend.displayName} بنجاح!` });
        setCodeInput('');
        setSelectedContactUid(res.friend.friendUid);
      } else if (res.reason === 'invalid_code') {
        setAddStatus({ type: 'err', text: 'اكتب كود صحيح مكون من 6 إلى 10 حروف وأرقام (مثل TOP12345).' });
      } else if (res.reason === 'self') {
        setAddStatus({ type: 'err', text: 'ده الكود بتاعك! ابعته لصاحبك وخُد الكود بتاعه.' });
      } else {
        setAddStatus({ type: 'err', text: 'مفيش طالب مسجل بالكود ده، تأكد من الحروف والأرقام.' });
      }
    } catch {
      setAddStatus({ type: 'err', text: 'تعذّر البحث عن الكود الآن، حاول مرة أخرى.' });
    } finally {
      setAddingFriend(false);
    }
  };

  const handleSendText = async (customText?: string) => {
    if (!firebaseUser || !selectedContact) return;
    const textToSend = (customText ?? messageText).trim();
    if (!textToSend || sending) return;

    setSending(true);
    setActionError(null);
    try {
      await sendFriendMessage({
        myUid: firebaseUser.uid,
        myName,
        myAvatar,
        friendUid: selectedContact.uid,
        friendName: selectedContact.name,
        friendAvatar: selectedContact.avatar,
        type: 'text',
        text: textToSend,
      });
      if (!customText) setMessageText('');
    } catch {
      setActionError('تعذّر إرسال الرسالة، تأكد من اتصالك بالإنترنت.');
    } finally {
      setSending(false);
    }
  };

  const handleSendChallenge = async (quiz: Quiz) => {
    if (!firebaseUser || !selectedContact || sending) return;
    setSending(true);
    setActionError(null);
    try {
      await sendFriendMessage({
        myUid: firebaseUser.uid,
        myName,
        myAvatar,
        friendUid: selectedContact.uid,
        friendName: selectedContact.name,
        friendAvatar: selectedContact.avatar,
        type: 'challenge',
        text: `بتحداك في ${quiz.title}! تقدر تجيب أعلى مني؟ ⚡`,
        quizId: quiz.id,
        quizTitle: quiz.title,
        subjectId: quiz.subjectId,
      });
      setShowChallengePicker(false);
    } catch {
      setActionError('تعذّر إرسال التحدي، حاول مرة أخرى.');
    } finally {
      setSending(false);
    }
  };

  const handleAcceptQuizChallenge = (msg: ChatMessage) => {
    if (!selectedContact) return;
    const daily = buildDailyChallengeQuiz();
    const matchedQuiz =
      (msg.quizId && msg.quizId.startsWith('daily-challenge-')
        ? daily
        : QUIZZES.find((q) => q.id === msg.quizId)) ||
      QUIZZES.find((q) => q.subjectId === msg.subjectId) ||
      QUIZZES[0];

    onAcceptChallenge(matchedQuiz, {
      friendUid: selectedContact.uid,
      friendName: selectedContact.name,
      friendAvatar: selectedContact.avatar,
      friendCode: selectedContact.friendCode,
    });
  };

  const getSubjectByQuiz = (subjectId?: string): Subject | undefined =>
    SUBJECTS.find((s) => s.id === subjectId);

  if (authLoading) {
    return (
      <div className="bg-white rounded-[24px] border border-slate-200/80 p-8 text-center space-y-3">
        <p className="font-display font-bold text-[#0F172A]">جاري تحميل شبكة الأصدقاء...</p>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="space-y-5">
        <section className="bg-white rounded-[24px] border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          <div className="max-w-xl mx-auto text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FFF3F6] flex items-center justify-center text-3xl">
              💬
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-[#0F172A]">
              تراسل مع أصحابك وابعتوا تحديات لبعض
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              سجّل الدخول بحساب جوجل عشان يطلع لك كود صداقة خاص في TOP1، وتضيف أصحابك وتبعتوا رسائل وتحديات اختبارات ونقطكم تتحدث لحظياً.
            </p>

            {authError && (
              <p className="text-xs sm:text-sm font-display font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
                {authError}
              </p>
            )}

            <button
              type="button"
              onClick={() => void onSignInGoogle()}
              className="min-h-[48px] px-7 py-3 rounded-full bg-[#0F172A] text-white font-display font-black text-sm sm:text-base hover:bg-[#1E293B] active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2.5"
            >
              <LogIn className="w-5 h-5 text-[#FFD93D]" aria-hidden="true" />
              <span>تسجيل الدخول بحساب جوجل</span>
            </button>
          </div>
        </section>

        <PWAInstallButton variant="card" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Friend Code & Quick Add Bar */}
      <section className="bg-white rounded-[22px] border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-display font-bold">
              <span>حساب الأصدقاء مفعّل</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#0F172A]">{myName}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-sm font-display font-bold text-slate-700">كودك الشخصي:</span>
              <span
                dir="ltr"
                className="font-mono font-black text-base sm:text-lg tracking-widest bg-[#FFF3CD] text-[#0F172A] px-3 py-1 rounded-xl tabular-nums"
              >
                {myFriendCode || '...'}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="min-h-[40px] px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-display font-bold text-[#0F172A] hover:bg-slate-50 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#17B8A6]" aria-hidden="true" />
                    <span>تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>نسخ الكود</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShareInviteLink}
                className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-[#17B8A6] text-white text-xs font-display font-bold hover:brightness-95 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                {copiedInvite ? (
                  <>
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>تم نسخ رابط الدعوة</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>دعوة صديق</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void onSignOutGoogle()}
            className="min-h-[40px] px-4 py-1.5 rounded-full border border-slate-200 text-xs font-display font-bold text-slate-600 hover:text-rose-700 hover:bg-rose-50 inline-flex items-center gap-1.5 self-start md:self-center whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>تسجيل الخروج</span>
          </button>
        </div>

        <form onSubmit={handleAddFriend} className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-slate-100">
          <input
            type="text"
            dir="ltr"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            placeholder="أدخل كود صاحبك مثل TOP4K9B2"
            maxLength={10}
            aria-label="كود الصديق"
            className="flex-1 min-h-[46px] px-4 rounded-full border border-slate-200 bg-slate-50 text-sm font-mono font-bold text-[#0F172A] placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0F172A]"
          />
          <button
            type="submit"
            disabled={addingFriend || !codeInput.trim()}
            className="min-h-[46px] px-6 rounded-full bg-[#0F172A] text-white font-display font-extrabold text-sm hover:bg-[#1E293B] disabled:opacity-50 inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4 text-[#FFD93D]" aria-hidden="true" />
            <span>{addingFriend ? 'جاري البحث...' : 'إضافة صديق'}</span>
          </button>
        </form>

        {addStatus && (
          <p
            className={`text-xs sm:text-sm font-display font-bold px-3.5 py-2 rounded-xl ${
              addStatus.type === 'ok'
                ? 'bg-[#E9FAF8] text-[#0F766E]'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {addStatus.text}
          </p>
        )}
      </section>

      {/* Two-Column Contacts + Live Chat Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Contacts List */}
        <section
          className={`lg:col-span-5 bg-white rounded-[22px] border border-slate-200/80 p-4 shadow-xs space-y-3 ${
            selectedContact ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-black text-[#0F172A] flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#FF5A7A]" aria-hidden="true" />
              <span>أصحابك ({contacts.length})</span>
            </h2>
          </div>

          {contacts.length === 0 ? (
            <div className="py-10 px-4 text-center space-y-2 text-slate-500">
              <p className="font-display font-bold text-sm text-[#0F172A]">لسه مفيش أصحاب مضافين</p>
              <p className="text-xs leading-relaxed">
                ابعت كودك الشخصي لأصحابك على واتساب، أو اكتب كود أي صديق فوق عشان تبدأوا تبعتوا رسائل وتحديات لبعض.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {contacts.map((c) => {
                const isSelected = selectedContactUid === c.uid;
                const liveProf = friendProfiles[c.uid];
                return (
                  <div
                    key={c.uid}
                    className={`py-2.5 px-2 rounded-xl transition-colors flex items-center justify-between gap-2 ${
                      isSelected ? 'bg-[#FFF3F6]' : 'hover:bg-slate-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedContactUid(c.uid)}
                      className="flex-1 min-w-0 text-right flex items-center gap-3 min-h-[44px]"
                    >
                      <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-2xl shrink-0">
                        {c.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display font-bold text-sm text-[#0F172A] truncate">
                            {c.name}
                          </span>
                          {liveProf && (
                            <span className="text-xs font-display font-bold text-[#7A5A00] tabular-nums shrink-0">
                              {liveProf.points} ⭐
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {c.lastMessageText || 'اضغط لبدء المحادثة أو إرسال تحدي'}
                        </p>
                      </div>
                    </button>

                    {c.isAddedFriend && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!firebaseUser) return;
                          void removeFriend(firebaseUser.uid, c.uid);
                          if (selectedContactUid === c.uid) setSelectedContactUid(null);
                        }}
                        aria-label={`حذف ${c.name}`}
                        className="w-9 h-9 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Active Chat Panel */}
        <section
          className={`lg:col-span-7 bg-white rounded-[22px] border border-slate-200/80 shadow-xs flex flex-col min-h-[460px] max-h-[640px] ${
            selectedContact ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {!selectedContact ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2">
              <div className="text-4xl" aria-hidden="true">
                ⚡
              </div>
              <h3 className="font-display font-black text-lg text-[#0F172A]">
                اختر صديقاً للمراسلة
              </h3>
              <p className="text-sm text-slate-500 max-w-sm">
                اضغط على اسم أي صديق من القائمة عشان تبعتله رسالة تشجيع أو تتحداه في اختبار من الـ 7 مواد.
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedContactUid(null)}
                    aria-label="رجوع لقائمة الأصدقاء"
                    className="lg:hidden w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#0F172A] shrink-0"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="w-11 h-11 rounded-full bg-[#FFF3CD] flex items-center justify-center text-2xl shrink-0">
                    {selectedContact.avatar}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-black text-base text-[#0F172A] truncate">
                      {selectedContact.name}
                    </h3>
                    <p className="text-xs text-slate-500 tabular-nums">
                      {friendProfiles[selectedContact.uid]
                        ? `${friendProfiles[selectedContact.uid].points} نقطة · سلسلة ${friendProfiles[selectedContact.uid].streakDays} أيام`
                        : 'صديق في TOP1'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowChallengePicker((prev) => !prev)}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-[#FFD93D] text-[#0F172A] font-display font-black text-xs hover:brightness-95 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Zap className="w-4 h-4" aria-hidden="true" />
                  <span>ابعت تحدي</span>
                </button>
              </div>

              {/* Challenge Quiz Picker Drawer */}
              {showChallengePicker && (
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-xs text-[#0F172A]">
                      اختر الاختبار اللي عايز تتحدى فيه {selectedContact.name}:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowChallengePicker(false)}
                      className="text-xs text-slate-500 hover:text-[#0F172A]"
                    >
                      إلغاء
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => void handleSendChallenge(buildDailyChallengeQuiz())}
                      className="min-h-[38px] px-3 py-1.5 rounded-full bg-[#0F172A] text-[#FFD93D] text-xs font-display font-bold hover:bg-[#1E293B]"
                    >
                      ⚡ تحدي اليوم (5 مواد)
                    </button>
                    {QUIZZES.map((quiz) => {
                      const sub = getSubjectByQuiz(quiz.subjectId);
                      return (
                        <button
                          key={quiz.id}
                          type="button"
                          disabled={sending}
                          onClick={() => void handleSendChallenge(quiz)}
                          className="min-h-[38px] px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[#0F172A] text-xs font-display font-bold hover:border-[#FF5A7A]"
                        >
                          {sub?.emoji} {sub?.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FFF9FA]/60">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center text-xs sm:text-sm text-slate-500 px-4">
                    ابدأ المحادثة مع {selectedContact.name} برسالة سريعة أو ابعتله تحدي اختبار!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderUid === firebaseUser.uid;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 space-y-2 ${
                            isMine
                              ? 'bg-[#0F172A] text-white'
                              : 'bg-white border border-slate-200 text-[#0F172A]'
                          }`}
                        >
                          {msg.type === 'challenge' && (
                            <div
                              className={`rounded-xl p-2.5 text-xs space-y-2 ${
                                isMine ? 'bg-white/10 text-white' : 'bg-[#FFF3CD] text-[#0F172A]'
                              }`}
                            >
                              <div className="font-display font-black flex items-center gap-1.5">
                                <Zap className="w-4 h-4 text-[#FFD93D]" aria-hidden="true" />
                                <span>{msg.quizTitle || 'تحدي اختبار TOP1'}</span>
                              </div>
                              {!isMine && (
                                <button
                                  type="button"
                                  onClick={() => handleAcceptQuizChallenge(msg)}
                                  className="w-full min-h-[38px] px-3 py-1.5 rounded-full bg-[#0F172A] text-[#FFD93D] font-display font-black text-xs hover:bg-[#1E293B]"
                                >
                                  اقبل التحدي الآن ⚡
                                </button>
                              )}
                            </div>
                          )}

                          {msg.type === 'score_reply' && typeof msg.score === 'number' && (
                            <div
                              className={`rounded-xl p-2.5 text-xs font-display font-bold flex items-center gap-2 ${
                                isMine ? 'bg-white/10 text-[#FFD93D]' : 'bg-[#E9FAF8] text-[#0F766E]'
                              }`}
                            >
                              <Trophy className="w-4 h-4 shrink-0" aria-hidden="true" />
                              <span className="tabular-nums">
                                النتيجة: {msg.score} / {msg.total || 10}
                              </span>
                            </div>
                          )}

                          <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Study Prompts + Input */}
              <div className="p-3 border-t border-slate-100 space-y-2.5 bg-white rounded-b-[22px]">
                {actionError && (
                  <p className="text-xs font-display font-bold text-rose-700 px-2">{actionError}</p>
                )}

                <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                  {QUICK_MESSAGES.map((qm) => (
                    <button
                      key={qm}
                      type="button"
                      disabled={sending}
                      onClick={() => void handleSendText(qm)}
                      className="min-h-[34px] px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-display font-bold text-[#0F172A] whitespace-nowrap shrink-0"
                    >
                      {qm}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSendText();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    maxLength={500}
                    placeholder={`اكتب رسالة إلى ${selectedContact.name}...`}
                    aria-label="نص الرسالة"
                    className="flex-1 min-h-[46px] px-4 rounded-full border border-slate-200 bg-slate-50 text-sm text-[#0F172A] focus:outline-none focus:bg-white focus:border-[#0F172A]"
                  />
                  <button
                    type="submit"
                    disabled={sending || !messageText.trim()}
                    aria-label="إرسال"
                    className="min-h-[46px] min-w-[46px] px-4 rounded-full bg-[#FF5A7A] text-white font-display font-black text-sm hover:brightness-95 disabled:opacity-50 inline-flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">إرسال</span>
                  </button>
                </form>
              </div>
            </>
          )}
        </section>
      </div>

      <PWAInstallButton variant="card" inviteCode={myFriendCode} />
    </div>
  );
};
