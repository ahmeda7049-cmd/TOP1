import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Users,
  Search,
  UserCheck,
  UserX,
  Plus,
  Clock,
  Edit3,
} from 'lucide-react';
import type {
  ChallengeReplyTarget,
  ChatMessage,
  FriendChat,
  FriendLink,
  FriendRequest,
  PublicProfile,
  Quiz,
  StudyTeam,
  Subject,
  TeamMessage,
} from '../types';
import { QUIZZES, SUBJECTS, buildDailyChallengeQuiz } from '../data/curriculum';
import {
  addFriendByCode,
  addMemberToStudyTeam,
  createStudyTeam,
  deleteFriendRequest,
  deleteStudyTeam,
  getChatId,
  removeFriend,
  respondToFriendRequest,
  sendFriendMessage,
  sendFriendRequest,
  sendTeamMessage,
  subscribeToChatMessages,
  subscribeToTeamMessages,
} from '../services/friendsService';
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
  discoverableProfiles: PublicProfile[];
  friendRequests: FriendRequest[];
  teams: StudyTeam[];
  pendingInviteCode: string | null;
  onClearPendingInvite: () => void;
  onSignInGoogle: () => Promise<void>;
  onSignOutGoogle: () => Promise<void>;
  onUpdateProfile: (name: string, avatarEmoji: string) => void;
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

type SocialSectionTab = 'chats' | 'teams' | 'requests' | 'discover';

const QUICK_MESSAGES = ['يلا نذاكر سوا! 💪', 'خلصت درس جديد 🔥', 'جاهز لتحدي اختبار؟ ⚡'];
const TEAM_QUICK_MESSAGES = [
  'أهلاً يا فريق! مين بدأ مذاكرة النهارده؟ 🔥',
  'يلا نتحدى بعض في اختبار سريع ⚡',
  'بالتوفيق يا أبطال TOP1 💪',
];

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
  discoverableProfiles,
  friendRequests,
  teams,
  pendingInviteCode,
  onClearPendingInvite,
  onSignInGoogle,
  onSignOutGoogle,
  onUpdateProfile,
  onAcceptChallenge,
}) => {
  const [sectionTab, setSectionTab] = useState<SocialSectionTab>('chats');

  // Inline App Display Name editor (ensures app name is shown instead of Google name)
  const [editingAppName, setEditingAppName] = useState(false);
  const [appNameInput, setAppNameInput] = useState(myName);

  // Code lookup state
  const [codeInput, setCodeInput] = useState('');
  const [addStatus, setAddStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [addingFriend, setAddingFriend] = useState(false);

  // Discover & friend request feedback state
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [busyRequestKey, setBusyRequestKey] = useState<string | null>(null);
  const [socialNotice, setSocialNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // 1-on-1 chat state
  const [selectedContactUid, setSelectedContactUid] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showChallengePicker, setShowChallengePicker] = useState(false);

  // Team group chat state
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamMessages, setTeamMessages] = useState<TeamMessage[]>([]);
  const [teamMessageText, setTeamMessageText] = useState('');
  const [sendingTeamMsg, setSendingTeamMsg] = useState(false);
  const [showTeamChallengePicker, setShowTeamChallengePicker] = useState(false);
  const [showCreateTeamForm, setShowCreateTeamForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [selectedTeamMemberUids, setSelectedTeamMemberUids] = useState<string[]>([]);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [showAddMemberDrawer, setShowAddMemberDrawer] = useState(false);
  const [addingMemberUid, setAddingMemberUid] = useState<string | null>(null);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const teamMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAppNameInput(myName);
  }, [myName]);

  // Profile directory lookup across friends + discoverable app users (live app-registered names)
  const directoryByUid = useMemo(() => {
    const map: Record<string, PublicProfile> = { ...friendProfiles };
    for (const p of discoverableProfiles) {
      map[p.uid] = p;
    }
    return map;
  }, [friendProfiles, discoverableProfiles]);

  // Friend requests split into incoming pending & outgoing
  const incomingPendingRequests = useMemo(() => {
    if (!firebaseUser) return [];
    return friendRequests.filter(
      (r) => r.toUid === firebaseUser.uid && r.status === 'pending'
    );
  }, [firebaseUser, friendRequests]);

  const outgoingRequests = useMemo(() => {
    if (!firebaseUser) return [];
    return friendRequests.filter((r) => r.fromUid === firebaseUser.uid);
  }, [firebaseUser, friendRequests]);

  // Discoverable app users excluding self
  const filteredDiscoverableUsers = useMemo(() => {
    if (!firebaseUser) return [];
    const q = discoverSearch.trim().toLowerCase();
    return discoverableProfiles.filter((p) => {
      if (p.uid === firebaseUser.uid) return false;
      if (!q) return true;
      return (
        p.displayName.toLowerCase().includes(q) ||
        p.friendCode.toLowerCase().includes(q)
      );
    });
  }, [firebaseUser, discoverableProfiles, discoverSearch]);

  // Merge explicitly added friends and active 1-on-1 chat participants
  const contacts: ConversationContact[] = useMemo(() => {
    if (!firebaseUser) return [];
    const map = new Map<string, ConversationContact>();

    for (const f of friends) {
      const live = directoryByUid[f.friendUid];
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
      const live = directoryByUid[otherUid];
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
  }, [firebaseUser, friends, chats, directoryByUid]);

  const selectedContact = contacts.find((c) => c.uid === selectedContactUid) || null;
  const selectedTeam = teams.find((t) => t.teamId === selectedTeamId) || null;

  useEffect(() => {
    if (sectionTab === 'chats' && !selectedContactUid && contacts.length > 0 && window.innerWidth >= 1024) {
      setSelectedContactUid(contacts[0].uid);
    }
  }, [sectionTab, contacts, selectedContactUid]);

  useEffect(() => {
    if (sectionTab === 'teams' && !selectedTeamId && teams.length > 0 && window.innerWidth >= 1024) {
      setSelectedTeamId(teams[0].teamId);
    }
  }, [sectionTab, teams, selectedTeamId]);

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
          setSectionTab('chats');
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

  const activeChatId =
    firebaseUser && selectedContact ? getChatId(firebaseUser.uid, selectedContact.uid) : null;
  const activeChatExists = Boolean(
    activeChatId && chats.some((c) => c.chatId === activeChatId)
  );

  useEffect(() => {
    if (!firebaseUser || !activeChatId || !activeChatExists) {
      setMessages([]);
      return;
    }
    const unsub = subscribeToChatMessages(
      activeChatId,
      firebaseUser.uid,
      (msgs) => {
        setMessages(msgs);
      },
      () => {
        setActionError('تعذّر تحميل الرسائل لحظياً، حاول إعادة فتح المحادثة.');
      }
    );
    return () => unsub();
  }, [firebaseUser, activeChatId, activeChatExists]);

  useEffect(() => {
    if (!firebaseUser || !selectedTeamId || !selectedTeam) {
      setTeamMessages([]);
      return;
    }
    const unsub = subscribeToTeamMessages(
      selectedTeamId,
      firebaseUser.uid,
      (msgs) => {
        setTeamMessages(msgs);
      },
      () => {
        setActionError('تعذّر تحميل رسائل الفريق لحظياً، حاول مرة أخرى.');
      }
    );
    return () => unsub();
  }, [firebaseUser, selectedTeamId, selectedTeam]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    teamMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [teamMessages.length]);

  const handleSaveAppName = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = appNameInput.trim();
    if (!cleaned) return;
    onUpdateProfile(cleaned.slice(0, 40), myAvatar);
    setEditingAppName(false);
    setSocialNotice({
      type: 'ok',
      text: `تم حفظ اسمك في التطبيق (${cleaned.slice(0, 40)}) — وهو الاسم اللي هيظهر في طلبات الصداقة.`,
    });
  };

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
        setSectionTab('chats');
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

  const handleSendFriendRequest = async (targetProfile: PublicProfile, replacesDeclined = false) => {
    if (!firebaseUser || !myFriendCode || busyRequestKey) return;
    setBusyRequestKey(targetProfile.uid);
    setSocialNotice(null);
    try {
      await sendFriendRequest({
        fromUid: firebaseUser.uid,
        fromName: myName,
        fromAvatar: myAvatar,
        fromCode: myFriendCode,
        toProfile: targetProfile,
        replacesDeclined,
      });
      setSocialNotice({
        type: 'ok',
        text: `تم إرسال طلب صداقة باسم "${myName}" إلى ${targetProfile.displayName}!`,
      });
    } catch {
      setSocialNotice({
        type: 'err',
        text: 'تعذّر إرسال طلب الصداقة الآن، حاول مرة أخرى.',
      });
    } finally {
      setBusyRequestKey(null);
    }
  };

  const handleRespondToRequest = async (
    req: FriendRequest,
    decision: 'accepted' | 'declined'
  ) => {
    if (busyRequestKey) return;
    setBusyRequestKey(req.requestId);
    setSocialNotice(null);
    const senderLabel = directoryByUid[req.fromUid]?.displayName || req.fromName;
    try {
      await respondToFriendRequest(req, decision);
      setSocialNotice({
        type: 'ok',
        text:
          decision === 'accepted'
            ? `أصبحتم أصدقاء أنت و${senderLabel}! تقدروا دلوقتي تعملوا شات فريق مع بعض.`
            : `تم رفض طلب الصداقة من ${senderLabel}.`,
      });
    } catch {
      setSocialNotice({
        type: 'err',
        text: 'تعذّر تنفيذ الإجراء الآن، تأكد من اتصالك بالإنترنت.',
      });
    } finally {
      setBusyRequestKey(null);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (busyRequestKey) return;
    setBusyRequestKey(requestId);
    try {
      await deleteFriendRequest(requestId);
    } catch {
      setSocialNotice({ type: 'err', text: 'تعذّر حذف الطلب الآن.' });
    } finally {
      setBusyRequestKey(null);
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
        chatAlreadyExists: activeChatExists,
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
        chatAlreadyExists: activeChatExists,
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

  const handleToggleTeamMemberChoice = (uid: string) => {
    setSelectedTeamMemberUids((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || creatingTeam) return;
    const cleanName = newTeamName.trim();
    if (!cleanName) return;

    setCreatingTeam(true);
    setActionError(null);
    try {
      const teamId = await createStudyTeam({
        ownerUid: firebaseUser.uid,
        ownerName: myName,
        ownerAvatar: myAvatar,
        teamName: cleanName,
        memberUids: selectedTeamMemberUids,
      });
      setNewTeamName('');
      setSelectedTeamMemberUids([]);
      setShowCreateTeamForm(false);
      setSelectedTeamId(teamId);
      setSectionTab('teams');
    } catch {
      setActionError('تعذّر إنشاء شات الفريق، حاول مرة أخرى.');
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleAddMemberToTeam = async (friend: FriendLink) => {
    if (!firebaseUser || !selectedTeam || addingMemberUid) return;
    setAddingMemberUid(friend.friendUid);
    setActionError(null);
    const liveName = directoryByUid[friend.friendUid]?.displayName || friend.displayName;
    try {
      await addMemberToStudyTeam(
        selectedTeam,
        friend.friendUid,
        firebaseUser.uid,
        myName,
        liveName
      );
    } catch {
      setActionError('تعذّر إضافة العضو إلى الفريق.');
    } finally {
      setAddingMemberUid(null);
    }
  };

  const handleSendTeamText = async (customText?: string) => {
    if (!firebaseUser || !selectedTeam) return;
    const textToSend = (customText ?? teamMessageText).trim();
    if (!textToSend || sendingTeamMsg) return;

    setSendingTeamMsg(true);
    setActionError(null);
    try {
      await sendTeamMessage({
        team: selectedTeam,
        myUid: firebaseUser.uid,
        myName,
        myAvatar,
        type: 'text',
        text: textToSend,
      });
      if (!customText) setTeamMessageText('');
    } catch {
      setActionError('تعذّر إرسال الرسالة في شات الفريق.');
    } finally {
      setSendingTeamMsg(false);
    }
  };

  const handleSendTeamChallenge = async (quiz: Quiz) => {
    if (!firebaseUser || !selectedTeam || sendingTeamMsg) return;
    setSendingTeamMsg(true);
    setActionError(null);
    try {
      await sendTeamMessage({
        team: selectedTeam,
        myUid: firebaseUser.uid,
        myName,
        myAvatar,
        type: 'challenge',
        text: `تحدي جماعي للفريق في ${quiz.title}! ورونا مين رقم 1 ⚡`,
        quizId: quiz.id,
        quizTitle: quiz.title,
        subjectId: quiz.subjectId,
      });
      setShowTeamChallengePicker(false);
    } catch {
      setActionError('تعذّر إرسال التحدي للفريق.');
    } finally {
      setSendingTeamMsg(false);
    }
  };

  const handleAcceptTeamChallenge = (msg: TeamMessage) => {
    if (!selectedTeam) return;
    const daily = buildDailyChallengeQuiz();
    const matchedQuiz =
      (msg.quizId && msg.quizId.startsWith('daily-challenge-')
        ? daily
        : QUIZZES.find((q) => q.id === msg.quizId)) ||
      QUIZZES.find((q) => q.subjectId === msg.subjectId) ||
      QUIZZES[0];

    onAcceptChallenge(matchedQuiz, {
      friendUid: msg.senderUid,
      friendName: msg.senderName,
      friendAvatar: msg.senderAvatar,
      friendCode: '',
      teamId: selectedTeam.teamId,
      teamName: selectedTeam.name,
    });
  };

  const getSubjectByQuiz = (subjectId?: string): Subject | undefined =>
    SUBJECTS.find((s) => s.id === subjectId);

  if (authLoading) {
    return (
      <div className="bg-surface rounded-[24px] border border-line p-8 text-center space-y-3">
        <p className="font-display font-bold text-ink">جاري تحميل شبكة الأصدقاء...</p>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="space-y-5">
        <section className="bg-surface rounded-[24px] border border-line p-6 sm:p-8 shadow-xs">
          <div className="max-w-xl mx-auto text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-alt flex items-center justify-center text-3xl">
              💬
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-ink">
              تراسل مع أصحابك واعملوا شات فريق
            </h1>
            <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
              سجّل الدخول بحساب جوجل عشان تبعت طلبات صداقة بالاسم اللي مسجل بيه في TOP1 وتفتحوا شات فريق تتحدوا فيه بعض في الاختبارات.
            </p>

            {authError && (
              <p className="text-xs sm:text-sm font-display font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
                {authError}
              </p>
            )}

            <button
              type="button"
              onClick={() => void onSignInGoogle()}
              className="min-h-[48px] px-7 py-3 rounded-full bg-primary-btn text-primary-btn-ink font-display font-black text-sm sm:text-base hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2.5"
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

  const invitableFriendsForSelectedTeam = selectedTeam
    ? friends.filter((f) => !selectedTeam.memberUids.includes(f.friendUid))
    : [];

  return (
    <div className="space-y-5">
      {/* Top Friend Code, App Name & Share Bar */}
      <section className="bg-surface rounded-[22px] border border-line p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2.5 flex-1">
            {/* App Display Name Editor Row */}
            {!editingAppName ? (
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <span className="text-ink-muted font-display font-bold">
                  اسمك في طلبات الصداقة:
                </span>
                <span className="font-display font-black text-ink">
                  {myAvatar} {myName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAppNameInput(myName);
                    setEditingAppName(true);
                  }}
                  className="min-h-[34px] px-3 py-1 rounded-full bg-surface-alt border border-line text-xs font-display font-bold text-ink hover:border-brand inline-flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5 text-brand" aria-hidden="true" />
                  <span>تعديل الاسم</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveAppName} className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={appNameInput}
                  onChange={(e) => setAppNameInput(e.target.value)}
                  maxLength={40}
                  required
                  placeholder="اكتب اسمك في التطبيق..."
                  aria-label="اسمك في التطبيق"
                  className="min-h-[40px] px-3.5 py-1.5 rounded-full border border-line bg-surface-alt text-sm font-display font-bold text-ink focus:outline-none focus:border-brand"
                />
                <button
                  type="submit"
                  className="min-h-[40px] px-4 py-1.5 rounded-full bg-[#17B8A6] text-white text-xs font-display font-extrabold"
                >
                  حفظ الاسم
                </button>
                <button
                  type="button"
                  onClick={() => setEditingAppName(false)}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-surface-alt border border-line text-ink-muted text-xs font-display font-bold"
                >
                  إلغاء
                </button>
              </form>
            )}

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-sm font-display font-bold text-ink-muted">كودك الشخصي:</span>
              <span
                dir="ltr"
                className="font-mono font-black text-base sm:text-lg tracking-widest bg-[#FFF3CD] text-[#0F172A] px-3 py-1 rounded-xl tabular-nums"
              >
                {myFriendCode || '...'}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="min-h-[40px] px-3.5 py-1.5 rounded-full border border-line bg-surface-alt text-xs font-display font-bold text-ink hover:opacity-90 inline-flex items-center gap-1.5 whitespace-nowrap"
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
            className="min-h-[40px] px-4 py-1.5 rounded-full border border-line bg-surface-alt text-xs font-display font-bold text-ink-muted hover:text-rose-600 inline-flex items-center gap-1.5 self-start whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>تسجيل الخروج</span>
          </button>
        </div>

        {/* Social Navigation Tabs */}
        <div
          role="tablist"
          aria-label="أقسام الأصدقاء والفريق"
          className="flex items-center gap-1.5 p-1 bg-surface-alt rounded-2xl overflow-x-auto border border-line"
        >
          {[
            {
              id: 'chats' as SocialSectionTab,
              label: `شات الأصدقاء (${contacts.length})`,
              icon: MessageCircle,
              highlight: false,
            },
            {
              id: 'teams' as SocialSectionTab,
              label: `شات الفريق (${teams.length})`,
              icon: Users,
              highlight: false,
            },
            {
              id: 'requests' as SocialSectionTab,
              label: `طلبات الصداقة (${incomingPendingRequests.length})`,
              icon: UserCheck,
              highlight: incomingPendingRequests.length > 0,
            },
            {
              id: 'discover' as SocialSectionTab,
              label: `زملاء TOP1 (${filteredDiscoverableUsers.length})`,
              icon: UserPlus,
              highlight: false,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = sectionTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setSectionTab(tab.id)}
                className={`flex-1 min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-display font-extrabold whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-1.5 transition-all tabular-nums ${
                  isActive
                    ? 'bg-surface text-ink shadow-xs'
                    : tab.highlight
                    ? 'text-brand hover:bg-surface/60'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {socialNotice && (
          <p
            className={`text-xs sm:text-sm font-display font-bold px-3.5 py-2.5 rounded-xl ${
              socialNotice.type === 'ok'
                ? 'bg-[#E9FAF8] text-[#0F766E]'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {socialNotice.text}
          </p>
        )}
      </section>

      {/* ================= TAB 1: 1-ON-1 CHATS ================= */}
      {sectionTab === 'chats' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <section
            className={`lg:col-span-5 bg-surface rounded-[22px] border border-line p-4 shadow-xs space-y-3 ${
              selectedContact ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-black text-ink flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-brand" aria-hidden="true" />
                <span>أصحابك ({contacts.length})</span>
              </h2>
              <button
                type="button"
                onClick={() => setSectionTab('discover')}
                className="min-h-[36px] px-3 py-1 rounded-full bg-surface-alt border border-line hover:border-brand text-xs font-display font-bold text-ink whitespace-nowrap"
              >
                + إضافة صديق
              </button>
            </div>

            {contacts.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-3 text-ink-muted">
                <p className="font-display font-bold text-sm text-ink">لسه مفيش أصحاب مضافين</p>
                <p className="text-xs leading-relaxed">
                  افتح تبويب «زملاء TOP1» وابعت طلب صداقة للناس اللي محملة التطبيق، أو ضيف صاحبك بالكود الشخصي.
                </p>
                <button
                  type="button"
                  onClick={() => setSectionTab('discover')}
                  className="min-h-[42px] px-5 py-2 rounded-full bg-primary-btn text-primary-btn-ink text-xs font-display font-extrabold"
                >
                  تصفح زملاء TOP1
                </button>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {contacts.map((c) => {
                  const isSelected = selectedContactUid === c.uid;
                  const liveProf = directoryByUid[c.uid];
                  return (
                    <div
                      key={c.uid}
                      className={`py-2.5 px-2 rounded-xl transition-colors flex items-center justify-between gap-2 ${
                        isSelected ? 'bg-surface-alt' : 'hover:bg-surface-alt/60'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedContactUid(c.uid)}
                        className="flex-1 min-w-0 text-right flex items-center gap-3 min-h-[44px]"
                      >
                        <div className="w-11 h-11 rounded-full bg-surface-alt border border-line flex items-center justify-center text-2xl shrink-0">
                          {c.avatar}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display font-bold text-sm text-ink truncate">
                              {c.name}
                            </span>
                            {liveProf && (
                              <span className="text-xs font-display font-bold text-brand tabular-nums shrink-0">
                                {liveProf.points} ⭐
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-ink-muted truncate mt-0.5">
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
                          className="w-9 h-9 rounded-full text-ink-muted hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center shrink-0"
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

          <section
            className={`lg:col-span-7 bg-surface rounded-[22px] border border-line shadow-xs flex flex-col min-h-[460px] max-h-[640px] ${
              selectedContact ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {!selectedContact ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2">
                <div className="text-4xl" aria-hidden="true">
                  ⚡
                </div>
                <h3 className="font-display font-black text-lg text-ink">
                  اختر صديقاً للمراسلة
                </h3>
                <p className="text-sm text-ink-muted max-w-sm">
                  اضغط على اسم أي صديق من القائمة عشان تبعتله رسالة تشجيع أو تتحداه في اختبار، أو افتح شات الفريق للمذاكرة الجماعية.
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-line flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setSelectedContactUid(null)}
                      aria-label="رجوع لقائمة الأصدقاء"
                      className="lg:hidden w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center text-ink shrink-0"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <div className="w-11 h-11 rounded-full bg-[#FFF3CD] flex items-center justify-center text-2xl shrink-0">
                      {selectedContact.avatar}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-black text-base text-ink truncate">
                        {selectedContact.name}
                      </h3>
                      <p className="text-xs text-ink-muted tabular-nums">
                        {directoryByUid[selectedContact.uid]
                          ? `${directoryByUid[selectedContact.uid].points} نقطة · سلسلة ${directoryByUid[selectedContact.uid].streakDays} أيام`
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

                {showChallengePicker && (
                  <div className="p-3.5 bg-surface-alt border-b border-line space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-xs text-ink">
                        اختر الاختبار اللي عايز تتحدى فيه {selectedContact.name}:
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowChallengePicker(false)}
                        className="text-xs text-ink-muted hover:text-ink"
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
                            className="min-h-[38px] px-3 py-1.5 rounded-full bg-surface border border-line text-ink text-xs font-display font-bold hover:border-brand"
                          >
                            {sub?.emoji} {sub?.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-canvas/50">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center text-xs sm:text-sm text-ink-muted px-4">
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
                                ? 'bg-primary-btn text-primary-btn-ink'
                                : 'bg-surface border border-line text-ink'
                            }`}
                          >
                            {msg.type === 'challenge' && (
                              <div
                                className={`rounded-xl p-2.5 text-xs space-y-2 ${
                                  isMine ? 'bg-white/15' : 'bg-[#FFF3CD] text-[#0F172A]'
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
                                  isMine ? 'bg-white/15' : 'bg-[#E9FAF8] text-[#0F766E]'
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

                <div className="p-3 border-t border-line space-y-2.5 bg-surface rounded-b-[22px]">
                  {actionError && (
                    <p className="text-xs font-display font-bold text-rose-600 px-2">{actionError}</p>
                  )}

                  <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                    {QUICK_MESSAGES.map((qm) => (
                      <button
                        key={qm}
                        type="button"
                        disabled={sending}
                        onClick={() => void handleSendText(qm)}
                        className="min-h-[34px] px-3 py-1 rounded-full bg-surface-alt border border-line hover:border-brand text-xs font-display font-bold text-ink whitespace-nowrap shrink-0"
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
                      className="flex-1 min-h-[46px] px-4 rounded-full border border-line bg-surface-alt text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
                    />
                    <button
                      type="submit"
                      disabled={sending || !messageText.trim()}
                      aria-label="إرسال"
                      className="min-h-[46px] min-w-[46px] px-4 rounded-full bg-brand text-white font-display font-black text-sm hover:brightness-95 disabled:opacity-50 inline-flex items-center justify-center gap-1.5 shrink-0"
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
      )}

      {/* ================= TAB 2: TEAM GROUP CHAT (شات الفريق) ================= */}
      {sectionTab === 'teams' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <section
            className={`lg:col-span-5 bg-surface rounded-[22px] border border-line p-4 shadow-xs space-y-3.5 ${
              selectedTeam && !showCreateTeamForm ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-black text-ink flex items-center gap-2">
                <Users className="w-5 h-5 text-[#17B8A6]" aria-hidden="true" />
                <span>فِرَق المذاكرة ({teams.length})</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateTeamForm((prev) => !prev)}
                className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-primary-btn text-primary-btn-ink text-xs font-display font-extrabold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 text-[#FFD93D]" aria-hidden="true" />
                <span>{showCreateTeamForm ? 'إغلاق' : 'إنشاء شات فريق'}</span>
              </button>
            </div>

            {showCreateTeamForm && (
              <form
                onSubmit={handleCreateTeam}
                className="p-3.5 rounded-2xl bg-surface-alt border border-line space-y-3"
              >
                <div className="space-y-1">
                  <label className="block text-xs font-display font-bold text-ink">
                    اسم الفريق
                  </label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    maxLength={50}
                    required
                    placeholder="مثال: شلة المتفوقين 🏆"
                    className="w-full min-h-[42px] px-3.5 rounded-xl border border-line bg-surface text-sm text-ink focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-display font-bold text-ink-muted">
                    <span>اختار أصحابك للانضمام ({selectedTeamMemberUids.length})</span>
                    {friends.length === 0 && (
                      <button
                        type="button"
                        onClick={() => setSectionTab('discover')}
                        className="text-brand underline"
                      >
                        ابعت طلبات صداقة الأول
                      </button>
                    )}
                  </div>

                  {friends.length === 0 ? (
                    <p className="text-xs text-ink-muted bg-surface rounded-xl p-2.5 border border-line">
                      مفيش أصحاب مقبولين لسه — تقدر تنشئ الفريق دلوقتي وتضيف أصحابك أول ما يقبلوا طلبات الصداقة.
                    </p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1.5">
                      {friends.map((f) => {
                        const checked = selectedTeamMemberUids.includes(f.friendUid);
                        const live = directoryByUid[f.friendUid];
                        return (
                          <button
                            key={f.friendUid}
                            type="button"
                            onClick={() => handleToggleTeamMemberChoice(f.friendUid)}
                            className={`w-full min-h-[42px] px-3 py-1.5 rounded-xl border text-right flex items-center justify-between gap-2 text-xs font-display font-bold transition-colors ${
                              checked
                                ? 'bg-[#E9FAF8] border-[#17B8A6] text-[#0F172A]'
                                : 'bg-surface border-line text-ink hover:bg-surface-alt'
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <span aria-hidden="true">{live?.avatarEmoji || f.avatarEmoji}</span>
                              <span className="truncate">{live?.displayName || f.displayName}</span>
                            </span>
                            {checked && <Check className="w-4 h-4 text-[#17B8A6] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={creatingTeam || !newTeamName.trim()}
                  className="w-full min-h-[44px] px-4 py-2 rounded-full bg-[#17B8A6] text-white font-display font-black text-sm hover:brightness-95 disabled:opacity-50"
                >
                  {creatingTeam ? 'جاري إنشاء الفريق...' : 'ابدأ شات الفريق الآن 🚀'}
                </button>
              </form>
            )}

            {teams.length === 0 && !showCreateTeamForm ? (
              <div className="py-10 px-4 text-center space-y-3 text-ink-muted">
                <p className="font-display font-bold text-sm text-ink">لسه معندكش شات فريق</p>
                <p className="text-xs leading-relaxed">
                  اجمع أصحابك اللي قبلوا طلب الصداقة في شات واحد زي فريق، واتفقوا على المذاكرة وتحدوا بعض في الـ 7 مواد!
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateTeamForm(true)}
                  className="min-h-[42px] px-5 py-2 rounded-full bg-[#17B8A6] text-white text-xs font-display font-extrabold"
                >
                  أنشئ أول فريق مذاكرة
                </button>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {teams.map((team) => {
                  const isSelected = selectedTeamId === team.teamId;
                  const isOwner = team.ownerUid === firebaseUser.uid;
                  return (
                    <div
                      key={team.teamId}
                      className={`py-2.5 px-2 rounded-xl transition-colors flex items-center justify-between gap-2 ${
                        isSelected ? 'bg-surface-alt' : 'hover:bg-surface-alt/60'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTeamId(team.teamId);
                          setShowCreateTeamForm(false);
                        }}
                        className="flex-1 min-w-0 text-right flex items-center gap-3 min-h-[44px]"
                      >
                        <div className="w-11 h-11 rounded-full bg-[#0F172A] text-[#FFD93D] flex items-center justify-center font-display font-black text-lg shrink-0">
                          <Users className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-display font-bold text-sm text-ink truncate">
                              {team.name}
                            </span>
                            <span className="text-xs font-display font-bold text-ink-muted tabular-nums shrink-0">
                              {team.memberUids.length} أعضاء
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted truncate mt-0.5">
                            {team.lastSenderName}: {team.lastMessageText}
                          </p>
                        </div>
                      </button>

                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => {
                            void deleteStudyTeam(team.teamId);
                            if (selectedTeamId === team.teamId) setSelectedTeamId(null);
                          }}
                          aria-label={`حذف فريق ${team.name}`}
                          className="w-9 h-9 rounded-full text-ink-muted hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center shrink-0"
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

          <section
            className={`lg:col-span-7 bg-surface rounded-[22px] border border-line shadow-xs flex flex-col min-h-[480px] max-h-[660px] ${
              selectedTeam ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {!selectedTeam ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2">
                <div className="text-4xl" aria-hidden="true">
                  👥
                </div>
                <h3 className="font-display font-black text-lg text-ink">
                  اختر فريقاً أو أنشئ فريقاً جديداً
                </h3>
                <p className="text-sm text-ink-muted max-w-sm">
                  في شات الفريق كلكم بتتكلموا في مكان واحد وتبعتوا تحديات اختبارات لكل أعضاء الفريق!
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-line flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setSelectedTeamId(null)}
                      aria-label="رجوع لقائمة الفرق"
                      className="lg:hidden w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center text-ink shrink-0"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <div className="w-11 h-11 rounded-full bg-[#0F172A] text-[#FFD93D] flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-black text-base text-ink truncate">
                        {selectedTeam.name}
                      </h3>
                      <p className="text-xs text-ink-muted truncate tabular-nums">
                        {selectedTeam.memberUids.length} أعضاء ·{' '}
                        {selectedTeam.memberUids
                          .map((uid) =>
                            uid === firebaseUser.uid
                              ? 'أنت'
                              : directoryByUid[uid]?.displayName ||
                                friends.find((f) => f.friendUid === uid)?.displayName ||
                                'عضو'
                          )
                          .slice(0, 4)
                          .join('، ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {selectedTeam.ownerUid === firebaseUser.uid && (
                      <button
                        type="button"
                        onClick={() => setShowAddMemberDrawer((prev) => !prev)}
                        className="min-h-[40px] px-3 py-1.5 rounded-full bg-surface-alt border border-line hover:border-brand text-ink font-display font-bold text-xs inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>ضم صديق</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowTeamChallengePicker((prev) => !prev)}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-[#FFD93D] text-[#0F172A] font-display font-black text-xs hover:brightness-95 inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Zap className="w-4 h-4" aria-hidden="true" />
                      <span>تحدي للفريق</span>
                    </button>
                  </div>
                </div>

                {showAddMemberDrawer && selectedTeam.ownerUid === firebaseUser.uid && (
                  <div className="p-3.5 bg-surface-alt border-b border-line space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-bold text-xs text-ink">
                        أضف من أصحابك المقبولين إلى فريق {selectedTeam.name}:
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddMemberDrawer(false)}
                        className="text-xs text-ink-muted hover:text-ink"
                      >
                        إغلاق
                      </button>
                    </div>
                    {invitableFriendsForSelectedTeam.length === 0 ? (
                      <p className="text-xs text-ink-muted">
                        كل أصحابك الحاليين منضمون للفريق بالفعل، أو يمكنك إرسال طلبات صداقة جديدة من «زملاء TOP1».
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {invitableFriendsForSelectedTeam.map((f) => {
                          const liveName = directoryByUid[f.friendUid]?.displayName || f.displayName;
                          const liveAvatar = directoryByUid[f.friendUid]?.avatarEmoji || f.avatarEmoji;
                          return (
                            <button
                              key={f.friendUid}
                              type="button"
                              disabled={addingMemberUid === f.friendUid}
                              onClick={() => void handleAddMemberToTeam(f)}
                              className="min-h-[38px] px-3 py-1.5 rounded-full bg-surface border border-line hover:border-[#17B8A6] text-xs font-display font-bold text-ink inline-flex items-center gap-1.5"
                            >
                              <span aria-hidden="true">{liveAvatar}</span>
                              <span>+ {liveName}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-[11px] text-ink-muted">
                      يرى العضو الجديد رسائل الفريق بدايةً من وقت انضمامه.
                    </p>
                  </div>
                )}

                {showTeamChallengePicker && (
                  <div className="p-3.5 bg-surface-alt border-b border-line space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-xs text-ink">
                        ابعت تحدي جماعي لكل أعضاء فريق {selectedTeam.name}:
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowTeamChallengePicker(false)}
                        className="text-xs text-ink-muted hover:text-ink"
                      >
                        إلغاء
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={sendingTeamMsg}
                        onClick={() => void handleSendTeamChallenge(buildDailyChallengeQuiz())}
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
                            disabled={sendingTeamMsg}
                            onClick={() => void handleSendTeamChallenge(quiz)}
                            className="min-h-[38px] px-3 py-1.5 rounded-full bg-surface border border-line text-ink text-xs font-display font-bold hover:border-brand"
                          >
                            {sub?.emoji} {sub?.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-canvas/50">
                  {teamMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center text-xs sm:text-sm text-ink-muted px-4">
                      ابدأ الكلام في شات فريق {selectedTeam.name} وشجّع أصحابك على المذاكرة!
                    </div>
                  ) : (
                    teamMessages.map((msg) => {
                      const isMine = msg.senderUid === firebaseUser.uid;
                      const liveSenderName = directoryByUid[msg.senderUid]?.displayName || msg.senderName;
                      const liveSenderAvatar = directoryByUid[msg.senderUid]?.avatarEmoji || msg.senderAvatar;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMine ? 'items-start' : 'items-end'}`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 space-y-1.5 ${
                              isMine
                                ? 'bg-primary-btn text-primary-btn-ink'
                                : 'bg-surface border border-line text-ink'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 text-[11px] font-display font-bold opacity-85">
                              <span aria-hidden="true">{isMine ? myAvatar : liveSenderAvatar}</span>
                              <span>{isMine ? `${myName} (أنت)` : liveSenderName}</span>
                            </div>

                            {msg.type === 'challenge' && (
                              <div
                                className={`rounded-xl p-2.5 text-xs space-y-2 ${
                                  isMine ? 'bg-white/15' : 'bg-[#FFF3CD] text-[#0F172A]'
                                }`}
                              >
                                <div className="font-display font-black flex items-center gap-1.5">
                                  <Zap className="w-4 h-4 text-[#FFD93D]" aria-hidden="true" />
                                  <span>{msg.quizTitle || 'تحدي الفريق'}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAcceptTeamChallenge(msg)}
                                  className="w-full min-h-[38px] px-3 py-1.5 rounded-full bg-[#0F172A] text-[#FFD93D] font-display font-black text-xs hover:bg-[#1E293B]"
                                >
                                  شارك في التحدي الآن ⚡
                                </button>
                              </div>
                            )}

                            <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={teamMessagesEndRef} />
                </div>

                <div className="p-3 border-t border-line space-y-2.5 bg-surface rounded-b-[22px]">
                  {actionError && (
                    <p className="text-xs font-display font-bold text-rose-600 px-2">{actionError}</p>
                  )}

                  <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                    {TEAM_QUICK_MESSAGES.map((qm) => (
                      <button
                        key={qm}
                        type="button"
                        disabled={sendingTeamMsg}
                        onClick={() => void handleSendTeamText(qm)}
                        className="min-h-[34px] px-3 py-1 rounded-full bg-surface-alt border border-line hover:border-brand text-xs font-display font-bold text-ink whitespace-nowrap shrink-0"
                      >
                        {qm}
                      </button>
                    ))}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleSendTeamText();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={teamMessageText}
                      onChange={(e) => setTeamMessageText(e.target.value)}
                      maxLength={500}
                      placeholder={`اكتب رسالة في شات ${selectedTeam.name}...`}
                      aria-label="رسالة الفريق"
                      className="flex-1 min-h-[46px] px-4 rounded-full border border-line bg-surface-alt text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
                    />
                    <button
                      type="submit"
                      disabled={sendingTeamMsg || !teamMessageText.trim()}
                      aria-label="إرسال للفريق"
                      className="min-h-[46px] min-w-[46px] px-4 rounded-full bg-[#17B8A6] text-white font-display font-black text-sm hover:brightness-95 disabled:opacity-50 inline-flex items-center justify-center gap-1.5 shrink-0"
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
      )}

      {/* ================= TAB 3: FRIEND REQUESTS ================= */}
      {sectionTab === 'requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Incoming Pending Requests */}
          <section className="bg-surface rounded-[22px] border border-line p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-black text-ink flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-brand" aria-hidden="true" />
                <span>طلبات الصداقة الواردة ({incomingPendingRequests.length})</span>
              </h2>
            </div>

            {incomingPendingRequests.length === 0 ? (
              <div className="py-8 text-center space-y-2 text-ink-muted">
                <p className="font-display font-bold text-sm text-ink">
                  مفيش طلبات صداقة مستنياك دلوقتي
                </p>
                <p className="text-xs leading-relaxed">
                  لما أي طالب محمل التطبيق يبعتلك طلب صداقة، هيظهر هنا وتقدر تقبله وتعملوا شات فريق سوا.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {incomingPendingRequests.map((req) => {
                  const isBusy = busyRequestKey === req.requestId;
                  const liveSender = directoryByUid[req.fromUid];
                  const senderName = liveSender?.displayName || req.fromName;
                  const senderAvatar = liveSender?.avatarEmoji || req.fromAvatar;

                  return (
                    <div
                      key={req.requestId}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-[#FFF3CD] flex items-center justify-center text-2xl shrink-0">
                          {senderAvatar}
                        </div>
                        <div className="min-w-0">
                          <p className="font-display font-bold text-sm text-ink truncate">
                            {senderName}
                          </p>
                          <p className="text-xs text-ink-muted tabular-nums">
                            كود: {req.fromCode}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleRespondToRequest(req, 'accepted')}
                          className="min-h-[42px] px-4 py-1.5 rounded-full bg-[#17B8A6] text-white font-display font-extrabold text-xs hover:brightness-95 disabled:opacity-50 inline-flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <Check className="w-4 h-4" aria-hidden="true" />
                          <span>قبول</span>
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleRespondToRequest(req, 'declined')}
                          className="min-h-[42px] px-4 py-1.5 rounded-full bg-surface-alt border border-line text-ink-muted font-display font-bold text-xs hover:text-rose-600 disabled:opacity-50 inline-flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <UserX className="w-4 h-4" aria-hidden="true" />
                          <span>رفض</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Outgoing Requests */}
          <section className="bg-surface rounded-[22px] border border-line p-5 shadow-xs space-y-4">
            <h2 className="font-display text-lg font-black text-ink flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#17B8A6]" aria-hidden="true" />
              <span>الطلبات اللي بعتها ({outgoingRequests.length})</span>
            </h2>

            {outgoingRequests.length === 0 ? (
              <div className="py-8 text-center space-y-3 text-ink-muted">
                <p className="font-display font-bold text-sm text-ink">
                  مبعتش طلبات صداقة لسه
                </p>
                <button
                  type="button"
                  onClick={() => setSectionTab('discover')}
                  className="min-h-[42px] px-5 py-2 rounded-full bg-primary-btn text-primary-btn-ink text-xs font-display font-extrabold"
                >
                  اكتشف طلاب TOP1 الآن
                </button>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {outgoingRequests.map((req) => {
                  const liveTarget = directoryByUid[req.toUid];
                  const targetName = liveTarget?.displayName || req.toName;
                  const targetAvatar = liveTarget?.avatarEmoji || req.toAvatar;
                  return (
                    <div
                      key={req.requestId}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-surface-alt border border-line flex items-center justify-center text-2xl shrink-0">
                          {targetAvatar}
                        </div>
                        <div className="min-w-0">
                          <p className="font-display font-bold text-sm text-ink truncate">
                            {targetName}
                          </p>
                          <p className="text-xs text-ink-muted">
                            {req.status === 'accepted'
                              ? 'تم القبول ✅'
                              : req.status === 'declined'
                              ? 'تم الرفض'
                              : 'بانتظار الموافقة...'}
                          </p>
                        </div>
                      </div>

                      {req.status === 'pending' && (
                        <button
                          type="button"
                          disabled={busyRequestKey === req.requestId}
                          onClick={() => void handleCancelRequest(req.requestId)}
                          className="min-h-[38px] px-3.5 py-1.5 rounded-full border border-line bg-surface-alt text-xs font-display font-bold text-ink-muted hover:text-rose-600 whitespace-nowrap"
                        >
                          إلغاء الطلب
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ================= TAB 4: DISCOVER TOP1 APP USERS + ADD BY CODE ================= */}
      {sectionTab === 'discover' && (
        <div className="space-y-5">
          {/* Direct Add by Code */}
          <section className="bg-surface rounded-[22px] border border-line p-4 sm:p-5 shadow-xs space-y-3">
            <h2 className="font-display text-base sm:text-lg font-black text-ink">
              إضافة صديق بالكود المباشر
            </h2>
            <form onSubmit={handleAddFriend} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                dir="ltr"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="أدخل كود صاحبك مثل TOP4K9B2"
                maxLength={10}
                aria-label="كود الصديق"
                className="flex-1 min-h-[46px] px-4 rounded-full border border-line bg-surface-alt text-sm font-mono font-bold text-ink placeholder:font-sans placeholder:text-ink-muted focus:outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={addingFriend || !codeInput.trim()}
                className="min-h-[46px] px-6 rounded-full bg-primary-btn text-primary-btn-ink font-display font-extrabold text-sm hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-4 h-4 text-[#FFD93D]" aria-hidden="true" />
                <span>{addingFriend ? 'جاري البحث...' : 'إضافة بالكود'}</span>
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

          {/* Discover Students Who Installed TOP1 */}
          <section className="bg-surface rounded-[22px] border border-line p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-black text-ink">
                  طلاب محمّلين تطبيق TOP1 ({filteredDiscoverableUsers.length})
                </h2>
                <p className="text-xs sm:text-sm text-ink-muted mt-0.5">
                  يظهر هنا كل طالب بالاسم المسجّل في التطبيق (وليس اسم جوجل) — ابعت طلب صداقة عشان تعملوا شات فريق سوا.
                </p>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-ink-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={discoverSearch}
                  onChange={(e) => setDiscoverSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو الكود..."
                  className="w-full min-h-[44px] pr-10 pl-4 py-2 rounded-full bg-surface-alt border border-line text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            {filteredDiscoverableUsers.length === 0 ? (
              <div className="py-10 text-center space-y-2 text-ink-muted">
                <p className="font-display font-bold text-sm text-ink">
                  لسه مفيش زملاء ظاهرين حالياً بالبحث ده
                </p>
                <p className="text-xs leading-relaxed">
                  شارك رابط التطبيق مع أصحابك في الفصل، وبمجرد ما يسجلوا الدخول هيظهروا هنا وتبعتوا طلبات صداقة لبعض.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredDiscoverableUsers.map((student) => {
                  const isAlreadyFriend = friends.some((f) => f.friendUid === student.uid);
                  const sentReq = friendRequests.find(
                    (r) => r.fromUid === firebaseUser.uid && r.toUid === student.uid
                  );
                  const receivedReq = friendRequests.find(
                    (r) => r.fromUid === student.uid && r.toUid === firebaseUser.uid
                  );
                  const isBusy = busyRequestKey === student.uid;

                  return (
                    <div
                      key={student.uid}
                      className="p-3.5 rounded-2xl border border-line bg-surface-alt/40 flex items-center justify-between gap-3 hover:border-brand/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-[#FFF3CD] flex items-center justify-center text-2xl shrink-0">
                          {student.avatarEmoji}
                        </div>
                        <div className="min-w-0">
                          <p className="font-display font-bold text-sm text-ink truncate">
                            {student.displayName}
                          </p>
                          <p className="text-xs text-ink-muted tabular-nums mt-0.5">
                            {student.points} نقطة · سلسلة {student.streakDays} أيام
                          </p>
                        </div>
                      </div>

                      {isAlreadyFriend ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedContactUid(student.uid);
                            setSectionTab('chats');
                          }}
                          className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-[#E9FAF8] text-[#0F766E] font-display font-bold text-xs whitespace-nowrap shrink-0"
                        >
                          صديقك · شات
                        </button>
                      ) : receivedReq && receivedReq.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => setSectionTab('requests')}
                          className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-[#FFD93D] text-[#0F172A] font-display font-extrabold text-xs whitespace-nowrap shrink-0"
                        >
                          اقبل طلبه
                        </button>
                      ) : sentReq && sentReq.status === 'pending' ? (
                        <span className="text-xs font-display font-bold text-ink-muted whitespace-nowrap shrink-0">
                          تم الإرسال ⏳
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            void handleSendFriendRequest(
                              student,
                              sentReq?.status === 'declined'
                            )
                          }
                          className="min-h-[40px] px-3.5 py-1.5 rounded-full bg-primary-btn text-primary-btn-ink font-display font-extrabold text-xs hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-[#FFD93D]" aria-hidden="true" />
                          <span>{isBusy ? 'جاري الإرسال...' : 'طلب صداقة'}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      <PWAInstallButton variant="card" inviteCode={myFriendCode} />
    </div>
  );
};
