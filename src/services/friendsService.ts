import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type {
  ChatMessage,
  FriendChat,
  FriendLink,
  FriendRequest,
  FriendRequestStatus,
  MessageType,
  PublicProfile,
  StudyTeam,
  SubjectId,
  TeamMessage,
  TeamMessageType,
} from '../types';

function hashUidToCode(uid: string, salt = ''): string {
  const input = `${uid}:${salt}`;
  let h1 = 2166136261;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 16777619);
    h2 ^= ch + i;
    h2 = Math.imul(h2, 2246822519);
  }
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let suffix = '';
  let combined = ((h1 >>> 0) * 4294967296 + (h2 >>> 0)) >>> 0;
  for (let i = 0; i < 5; i++) {
    suffix += alphabet[Math.abs(combined) % alphabet.length];
    combined = Math.floor(combined / alphabet.length) ^ ((h1 >>> (i * 3)) & 0xff);
  }
  return `TOP${suffix}`;
}

export function getChatId(uidA: string, uidB: string): string {
  return uidA < uidB ? `${uidA}_${uidB}` : `${uidB}_${uidA}`;
}

function sanitizeName(name: string): string {
  const clean = name.trim().slice(0, 40);
  return clean.length > 0 ? clean : 'طالب TOP1';
}

function sanitizeAvatar(emoji: string): string {
  const clean = emoji.trim().slice(0, 16);
  return clean.length > 0 ? clean : '🧑‍🎓';
}

function clampInt(value: number, min: number, max: number): number {
  const n = Math.round(Number.isFinite(value) ? value : 0);
  return Math.min(max, Math.max(min, n));
}

export interface ProvisionedAccount {
  friendCode: string;
  resolvedName: string;
}

export async function ensureUserProvisioned(
  user: User,
  appDisplayName: string,
  avatarEmoji: string,
  points: number,
  streakDays: number,
  completedCount: number,
  hasCustomAppName = false
): Promise<ProvisionedAccount> {
  const uid = user.uid;
  const googleName = (user.displayName || '').trim();
  const safeAvatar = sanitizeAvatar(avatarEmoji);
  const safeEmail = (user.email || `${uid}@top1.app`).slice(0, 160);
  const safePoints = clampInt(points, 0, 100000);
  const safeStreak = clampInt(streakDays, 0, 3650);
  const safeCompleted = clampInt(completedCount, 0, 200);

  let effectiveName = sanitizeName(appDisplayName);

  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  let friendCode = '';
  let userExists = false;

  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      userExists = true;
      friendCode = String(userSnap.data().friendCode || '');
      const storedUserName = String(userSnap.data().displayName || '').trim();
      // Preserve previously registered custom TOP1 name on new device sign-in,
      // but never restore Google account's display name.
      if (
        !hasCustomAppName &&
        storedUserName &&
        storedUserName !== googleName &&
        storedUserName !== effectiveName
      ) {
        effectiveName = sanitizeName(storedUserName);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  const profilePath = `profiles/${uid}`;
  const profileRef = doc(db, 'profiles', uid);
  let profileSnapData: Record<string, unknown> | null = null;
  try {
    const profSnap = await getDoc(profileRef);
    if (profSnap.exists()) {
      profileSnapData = profSnap.data() as Record<string, unknown>;
      const storedProfileName = String(profileSnapData.displayName || '').trim();
      if (
        !hasCustomAppName &&
        storedProfileName &&
        storedProfileName !== googleName &&
        storedProfileName !== effectiveName
      ) {
        effectiveName = sanitizeName(storedProfileName);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, profilePath);
  }

  if (!friendCode) {
    friendCode = hashUidToCode(uid);
    for (let attempt = 0; attempt < 4; attempt++) {
      const candidate = attempt === 0 ? friendCode : hashUidToCode(uid, String(attempt));
      const codePath = `friendCodes/${candidate}`;
      try {
        const codeSnap = await getDoc(doc(db, 'friendCodes', candidate));
        if (!codeSnap.exists() || codeSnap.data().uid === uid) {
          friendCode = candidate;
          break;
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, codePath);
      }
    }
  }

  if (!userExists) {
    try {
      await setDoc(userRef, {
        uid,
        email: safeEmail,
        displayName: effectiveName,
        avatarEmoji: safeAvatar,
        friendCode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, userPath);
    }
  } else {
    try {
      await updateDoc(userRef, {
        displayName: effectiveName,
        avatarEmoji: safeAvatar,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, userPath);
    }
  }

  try {
    if (!profileSnapData) {
      await setDoc(profileRef, {
        uid,
        displayName: effectiveName,
        avatarEmoji: safeAvatar,
        friendCode,
        points: safePoints,
        streakDays: safeStreak,
        completedCount: safeCompleted,
        isDiscoverable: true,
        updatedAt: serverTimestamp(),
      });
    } else {
      const existingPoints = Number(profileSnapData.points || 0);
      await updateDoc(profileRef, {
        displayName: effectiveName,
        avatarEmoji: safeAvatar,
        points: clampInt(Math.max(existingPoints, safePoints), 0, 100000),
        streakDays: clampInt(Math.max(Number(profileSnapData.streakDays || 0), safeStreak), 0, 3650),
        completedCount: clampInt(
          Math.max(Number(profileSnapData.completedCount || 0), safeCompleted),
          0,
          200
        ),
        isDiscoverable: true,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, profilePath);
  }

  const codePath = `friendCodes/${friendCode}`;
  const codeRef = doc(db, 'friendCodes', friendCode);
  try {
    const codeSnap = await getDoc(codeRef);
    if (!codeSnap.exists()) {
      await setDoc(codeRef, {
        code: friendCode,
        uid,
        displayName: effectiveName,
        avatarEmoji: safeAvatar,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (codeSnap.data().uid === uid) {
      await updateDoc(codeRef, {
        displayName: effectiveName,
        avatarEmoji: safeAvatar,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, codePath);
  }

  return { friendCode, resolvedName: effectiveName };
}

export async function syncProfileStats(
  uid: string,
  friendCode: string,
  displayName: string,
  avatarEmoji: string,
  points: number,
  streakDays: number,
  completedCount: number
): Promise<void> {
  const safeName = sanitizeName(displayName);
  const safeAvatar = sanitizeAvatar(avatarEmoji);
  const profilePath = `profiles/${uid}`;

  try {
    await updateDoc(doc(db, 'profiles', uid), {
      displayName: safeName,
      avatarEmoji: safeAvatar,
      points: clampInt(points, 0, 100000),
      streakDays: clampInt(streakDays, 0, 3650),
      completedCount: clampInt(completedCount, 0, 200),
      isDiscoverable: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, profilePath);
  }

  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: safeName,
      avatarEmoji: safeAvatar,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Ignore if user doc not yet created
  }

  if (friendCode) {
    const codePath = `friendCodes/${friendCode}`;
    try {
      await updateDoc(doc(db, 'friendCodes', friendCode), {
        displayName: safeName,
        avatarEmoji: safeAvatar,
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Ignore non-critical friendCode label sync error if not yet initialized
      void codePath;
    }
  }
}

export type AddFriendResult =
  | { ok: true; friend: FriendLink }
  | { ok: false; reason: 'invalid_code' | 'self' | 'not_found' };

export async function addFriendByCode(
  myUid: string,
  myFriendCode: string,
  rawCode: string
): Promise<AddFriendResult> {
  const normalized = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!/^[A-Z0-9]{6,10}$/.test(normalized)) {
    return { ok: false, reason: 'invalid_code' };
  }
  if (normalized === myFriendCode) {
    return { ok: false, reason: 'self' };
  }

  const codePath = `friendCodes/${normalized}`;
  let targetData: { uid: string; displayName: string; avatarEmoji: string } | null = null;
  try {
    const snap = await getDoc(doc(db, 'friendCodes', normalized));
    if (!snap.exists()) {
      return { ok: false, reason: 'not_found' };
    }
    const d = snap.data();
    targetData = {
      uid: String(d.uid),
      displayName: sanitizeName(String(d.displayName || 'صديق TOP1')),
      avatarEmoji: sanitizeAvatar(String(d.avatarEmoji || '🧑‍🎓')),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, codePath);
  }

  if (!targetData || targetData.uid === myUid) {
    return { ok: false, reason: 'self' };
  }

  // Also read live profile name/avatar
  const targetProfilePath = `profiles/${targetData.uid}`;
  try {
    const profSnap = await getDoc(doc(db, 'profiles', targetData.uid));
    if (!profSnap.exists()) {
      return { ok: false, reason: 'not_found' };
    }
    targetData.displayName = sanitizeName(String(profSnap.data().displayName || targetData.displayName));
    targetData.avatarEmoji = sanitizeAvatar(String(profSnap.data().avatarEmoji || targetData.avatarEmoji));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, targetProfilePath);
  }

  const friendPath = `users/${myUid}/friends/${targetData.uid}`;
  const link: FriendLink = {
    ownerUid: myUid,
    friendUid: targetData.uid,
    friendCode: normalized,
    displayName: targetData.displayName,
    avatarEmoji: targetData.avatarEmoji,
  };

  try {
    await setDoc(doc(db, 'users', myUid, 'friends', targetData.uid), {
      ...link,
      addedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, friendPath);
  }

  return { ok: true, friend: link };
}

export async function removeFriend(myUid: string, friendUid: string): Promise<void> {
  const path = `users/${myUid}/friends/${friendUid}`;
  try {
    await deleteDoc(doc(db, 'users', myUid, 'friends', friendUid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

function reportSnapshotError(
  error: unknown,
  op: OperationType,
  path: string,
  onError?: (err: Error) => void
) {
  try {
    handleFirestoreError(error, op, path);
  } catch (structuredErr) {
    if (onError) {
      onError(structuredErr instanceof Error ? structuredErr : new Error(String(structuredErr)));
    } else {
      throw structuredErr;
    }
  }
}

export function subscribeToFriends(
  myUid: string,
  onUpdate: (friends: FriendLink[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${myUid}/friends`;
  const q = query(collection(db, 'users', myUid, 'friends'), where('ownerUid', '==', myUid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: FriendLink[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          ownerUid: String(data.ownerUid),
          friendUid: String(data.friendUid),
          friendCode: String(data.friendCode),
          displayName: String(data.displayName),
          avatarEmoji: String(data.avatarEmoji),
        };
      });
      onUpdate(items);
    },
    (error) => {
      reportSnapshotError(error, OperationType.LIST, path, onError);
    }
  );
}

export function subscribeToProfile(
  uid: string,
  onUpdate: (profile: PublicProfile) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `profiles/${uid}`;
  return onSnapshot(
    doc(db, 'profiles', uid),
    (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      onUpdate({
        uid: String(d.uid),
        displayName: String(d.displayName),
        avatarEmoji: String(d.avatarEmoji),
        friendCode: String(d.friendCode),
        points: Number(d.points || 0),
        streakDays: Number(d.streakDays || 0),
        completedCount: Number(d.completedCount || 0),
      });
    },
    (error) => {
      reportSnapshotError(error, OperationType.GET, path, onError);
    }
  );
}

export function subscribeToMyChats(
  myUid: string,
  onUpdate: (chats: FriendChat[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'chats';
  const q = query(collection(db, 'chats'), where('participants', 'array-contains', myUid));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: FriendChat[] = snapshot.docs.map((d) => {
        const data = d.data();
        const ts = data.updatedAt as { toMillis?: () => number } | undefined;
        return {
          chatId: String(data.chatId),
          participants: Array.isArray(data.participants) ? data.participants.map(String) : [],
          p1Name: String(data.p1Name || 'صديق'),
          p2Name: String(data.p2Name || 'صديق'),
          p1Avatar: String(data.p1Avatar || '🧑‍🎓'),
          p2Avatar: String(data.p2Avatar || '🧑‍🎓'),
          lastMessageText: String(data.lastMessageText || ''),
          lastMessageType: (data.lastMessageType as MessageType) || 'text',
          lastSenderUid: String(data.lastSenderUid || ''),
          updatedAtMs: ts?.toMillis ? ts.toMillis() : Date.now(),
        };
      });
      list.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onUpdate(list);
    },
    (error) => {
      reportSnapshotError(error, OperationType.LIST, path, onError);
    }
  );
}

export function subscribeToChatMessages(
  chatId: string,
  myUid: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `chats/${chatId}/messages`;
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    where('participants', 'array-contains', myUid)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const list: ChatMessage[] = snapshot.docs.map((d) => {
        const data = d.data();
        const ts = data.createdAt as { toMillis?: () => number } | undefined;
        return {
          id: d.id,
          senderUid: String(data.senderUid),
          senderName: String(data.senderName),
          senderAvatar: String(data.senderAvatar),
          participants: Array.isArray(data.participants) ? data.participants.map(String) : [],
          type: (data.type as MessageType) || 'text',
          text: String(data.text || ''),
          quizId: data.quizId ? String(data.quizId) : undefined,
          quizTitle: data.quizTitle ? String(data.quizTitle) : undefined,
          subjectId: data.subjectId ? (String(data.subjectId) as SubjectId) : undefined,
          score: typeof data.score === 'number' ? data.score : undefined,
          total: typeof data.total === 'number' ? data.total : undefined,
          createdAtMs: ts?.toMillis ? ts.toMillis() : Date.now(),
        };
      });
      list.sort((a, b) => a.createdAtMs - b.createdAtMs);
      onUpdate(list);
    },
    (error) => {
      reportSnapshotError(error, OperationType.LIST, path, onError);
    }
  );
}

export interface SendMessageParams {
  myUid: string;
  myName: string;
  myAvatar: string;
  friendUid: string;
  friendName: string;
  friendAvatar: string;
  type: MessageType;
  text: string;
  chatAlreadyExists?: boolean;
  quizId?: string;
  quizTitle?: string;
  subjectId?: SubjectId;
  score?: number;
  total?: number;
}

export async function sendFriendMessage(params: SendMessageParams): Promise<void> {
  const cleanText = params.text.trim().slice(0, 500);
  if (!cleanText || !params.myUid || !params.friendUid || params.myUid === params.friendUid) {
    return;
  }

  const mySafeName = sanitizeName(params.myName);
  const mySafeAvatar = sanitizeAvatar(params.myAvatar);
  const friendSafeName = sanitizeName(params.friendName);
  const friendSafeAvatar = sanitizeAvatar(params.friendAvatar);

  const sorted = [params.myUid, params.friendUid].sort();
  const chatId = `${sorted[0]}_${sorted[1]}`;
  const isMyFirst = sorted[0] === params.myUid;

  const p1Name = isMyFirst ? mySafeName : friendSafeName;
  const p2Name = isMyFirst ? friendSafeName : mySafeName;
  const p1Avatar = isMyFirst ? mySafeAvatar : friendSafeAvatar;
  const p2Avatar = isMyFirst ? friendSafeAvatar : mySafeAvatar;

  const chatPath = `chats/${chatId}`;
  const chatRef = doc(db, 'chats', chatId);

  let chatExists = params.chatAlreadyExists;
  if (chatExists === undefined) {
    try {
      const chatSnap = await getDoc(chatRef);
      chatExists = chatSnap.exists();
    } catch {
      chatExists = false;
    }
  }

  const previewText = cleanText.slice(0, 300);

  if (!chatExists) {
    try {
      await setDoc(chatRef, {
        chatId,
        participants: sorted,
        p1Name,
        p2Name,
        p1Avatar,
        p2Avatar,
        lastMessageText: previewText,
        lastMessageType: params.type,
        lastSenderUid: params.myUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, chatPath);
    }
  } else {
    try {
      await updateDoc(chatRef, {
        p1Name,
        p2Name,
        p1Avatar,
        p2Avatar,
        lastMessageText: previewText,
        lastMessageType: params.type,
        lastSenderUid: params.myUid,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, chatPath);
    }
  }

  const msgId = `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const msgPath = `chats/${chatId}/messages/${msgId}`;

  const msgPayload: Record<string, unknown> = {
    senderUid: params.myUid,
    senderName: mySafeName,
    senderAvatar: mySafeAvatar,
    participants: sorted,
    type: params.type,
    text: cleanText,
    createdAt: serverTimestamp(),
  };

  if (params.quizId) msgPayload.quizId = params.quizId.slice(0, 80);
  if (params.quizTitle) msgPayload.quizTitle = params.quizTitle.slice(0, 120);
  if (params.subjectId) msgPayload.subjectId = params.subjectId.slice(0, 30);
  if (typeof params.score === 'number') msgPayload.score = clampInt(params.score, 0, 100);
  if (typeof params.total === 'number') msgPayload.total = clampInt(params.total, 1, 100);

  try {
    await setDoc(doc(db, 'chats', chatId, 'messages', msgId), msgPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, msgPath);
  }
}

// ==================== DISCOVERABLE USERS (APP USERS) ====================

export function subscribeToDiscoverableProfiles(
  onUpdate: (profiles: PublicProfile[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'profiles';
  const q = query(collection(db, 'profiles'), where('isDiscoverable', '==', true), limit(40));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: PublicProfile[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          uid: String(data.uid),
          displayName: String(data.displayName || 'طالب TOP1'),
          avatarEmoji: String(data.avatarEmoji || '🧑‍🎓'),
          friendCode: String(data.friendCode || ''),
          points: Number(data.points || 0),
          streakDays: Number(data.streakDays || 0),
          completedCount: Number(data.completedCount || 0),
          isDiscoverable: Boolean(data.isDiscoverable),
        };
      });
      items.sort((a, b) => b.points - a.points);
      onUpdate(items);
    },
    (error) => {
      reportSnapshotError(error, OperationType.LIST, path, onError);
    }
  );
}

// ==================== FRIEND REQUESTS ====================

export function subscribeToFriendRequests(
  myUid: string,
  onUpdate: (requests: FriendRequest[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'friendRequests';
  const q = query(collection(db, 'friendRequests'), where('participants', 'array-contains', myUid));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: FriendRequest[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdTs = data.createdAt as { toMillis?: () => number } | undefined;
        const updatedTs = data.updatedAt as { toMillis?: () => number } | undefined;
        return {
          requestId: String(data.requestId),
          fromUid: String(data.fromUid),
          toUid: String(data.toUid),
          fromName: String(data.fromName || 'طالب TOP1'),
          fromAvatar: String(data.fromAvatar || '🧑‍🎓'),
          fromCode: String(data.fromCode || ''),
          toName: String(data.toName || 'طالب TOP1'),
          toAvatar: String(data.toAvatar || '🧑‍🎓'),
          toCode: String(data.toCode || ''),
          participants: Array.isArray(data.participants) ? data.participants.map(String) : [],
          status: (data.status as FriendRequestStatus) || 'pending',
          createdAtMs: createdTs?.toMillis ? createdTs.toMillis() : Date.now(),
          updatedAtMs: updatedTs?.toMillis ? updatedTs.toMillis() : Date.now(),
        };
      });
      list.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onUpdate(list);
    },
    (error) => {
      reportSnapshotError(error, OperationType.LIST, path, onError);
    }
  );
}

export interface SendFriendRequestParams {
  fromUid: string;
  fromName: string;
  fromAvatar: string;
  fromCode: string;
  toProfile: PublicProfile;
  replacesDeclined?: boolean;
}

export async function sendFriendRequest(params: SendFriendRequestParams): Promise<void> {
  const { fromUid, toProfile } = params;
  if (!fromUid || !toProfile.uid || fromUid === toProfile.uid) return;
  if (!params.fromCode || !toProfile.friendCode) return;

  const requestId = `${fromUid}_${toProfile.uid}`;
  const reqPath = `friendRequests/${requestId}`;
  const reqRef = doc(db, 'friendRequests', requestId);

  if (params.replacesDeclined) {
    try {
      await deleteDoc(reqRef);
    } catch {
      // Ignore if already removed
    }
  }

  try {
    await setDoc(reqRef, {
      requestId,
      fromUid,
      toUid: toProfile.uid,
      fromName: sanitizeName(params.fromName),
      fromAvatar: sanitizeAvatar(params.fromAvatar),
      fromCode: params.fromCode,
      toName: sanitizeName(toProfile.displayName),
      toAvatar: sanitizeAvatar(toProfile.avatarEmoji),
      toCode: toProfile.friendCode,
      participants: [fromUid, toProfile.uid],
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, reqPath);
  }
}

export async function respondToFriendRequest(
  req: FriendRequest,
  decision: 'accepted' | 'declined'
): Promise<void> {
  const reqPath = `friendRequests/${req.requestId}`;
  try {
    await updateDoc(doc(db, 'friendRequests', req.requestId), {
      status: decision,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, reqPath);
  }

  if (decision === 'accepted') {
    const linkPath = `users/${req.toUid}/friends/${req.fromUid}`;
    try {
      await setDoc(doc(db, 'users', req.toUid, 'friends', req.fromUid), {
        ownerUid: req.toUid,
        friendUid: req.fromUid,
        friendCode: req.fromCode,
        displayName: sanitizeName(req.fromName),
        avatarEmoji: sanitizeAvatar(req.fromAvatar),
        addedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, linkPath);
    }
  }
}

export async function deleteFriendRequest(requestId: string): Promise<void> {
  const reqPath = `friendRequests/${requestId}`;
  try {
    await deleteDoc(doc(db, 'friendRequests', requestId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, reqPath);
  }
}

export async function syncAcceptedOutgoingRequests(
  myUid: string,
  existingFriendUids: Set<string>,
  requests: FriendRequest[]
): Promise<void> {
  const pendingSync = requests.filter(
    (req) => req.status === 'accepted' && req.fromUid === myUid && !existingFriendUids.has(req.toUid)
  );

  for (const req of pendingSync) {
    const linkPath = `users/${myUid}/friends/${req.toUid}`;
    try {
      await setDoc(doc(db, 'users', myUid, 'friends', req.toUid), {
        ownerUid: myUid,
        friendUid: req.toUid,
        friendCode: req.toCode,
        displayName: sanitizeName(req.toName),
        avatarEmoji: sanitizeAvatar(req.toAvatar),
        addedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, linkPath);
    }
  }
}

// ==================== STUDY TEAMS (GROUP CHAT) ====================

export function subscribeToMyTeams(
  myUid: string,
  onUpdate: (teams: StudyTeam[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = 'teams';
  const q = query(collection(db, 'teams'), where('memberUids', 'array-contains', myUid));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: StudyTeam[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdTs = data.createdAt as { toMillis?: () => number } | undefined;
        const updatedTs = data.updatedAt as { toMillis?: () => number } | undefined;
        return {
          teamId: String(data.teamId),
          name: String(data.name || 'فريق المذاكرة'),
          ownerUid: String(data.ownerUid || ''),
          memberUids: Array.isArray(data.memberUids) ? data.memberUids.map(String) : [],
          lastMessageText: String(data.lastMessageText || ''),
          lastSenderUid: String(data.lastSenderUid || ''),
          lastSenderName: String(data.lastSenderName || 'طالب TOP1'),
          createdAtMs: createdTs?.toMillis ? createdTs.toMillis() : Date.now(),
          updatedAtMs: updatedTs?.toMillis ? updatedTs.toMillis() : Date.now(),
        };
      });
      list.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onUpdate(list);
    },
    (error) => {
      reportSnapshotError(error, OperationType.LIST, path, onError);
    }
  );
}

export function subscribeToTeamMessages(
  teamId: string,
  myUid: string,
  onUpdate: (messages: TeamMessage[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `teams/${teamId}/messages`;
  const q = query(
    collection(db, 'teams', teamId, 'messages'),
    where('memberUids', 'array-contains', myUid)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const list: TeamMessage[] = snapshot.docs.map((d) => {
        const data = d.data();
        const ts = data.createdAt as { toMillis?: () => number } | undefined;
        return {
          id: d.id,
          senderUid: String(data.senderUid),
          senderName: String(data.senderName),
          senderAvatar: String(data.senderAvatar),
          memberUids: Array.isArray(data.memberUids) ? data.memberUids.map(String) : [],
          type: (data.type as TeamMessageType) || 'text',
          text: String(data.text || ''),
          quizId: data.quizId ? String(data.quizId) : undefined,
          quizTitle: data.quizTitle ? String(data.quizTitle) : undefined,
          subjectId: data.subjectId ? (String(data.subjectId) as SubjectId) : undefined,
          createdAtMs: ts?.toMillis ? ts.toMillis() : Date.now(),
        };
      });
      list.sort((a, b) => a.createdAtMs - b.createdAtMs);
      onUpdate(list);
    },
    (error) => {
      reportSnapshotError(error, OperationType.LIST, path, onError);
    }
  );
}

export interface CreateTeamParams {
  ownerUid: string;
  ownerName: string;
  ownerAvatar: string;
  teamName: string;
  memberUids: string[];
}

export async function createStudyTeam(params: CreateTeamParams): Promise<string> {
  const safeOwnerName = sanitizeName(params.ownerName);
  const safeOwnerAvatar = sanitizeAvatar(params.ownerAvatar);
  const cleanTeamName = params.teamName.trim().slice(0, 50) || 'فريق المذاكرة 🏆';

  const uniqueMembers = Array.from(new Set([params.ownerUid, ...params.memberUids])).slice(0, 25);
  const teamId = `team_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const teamPath = `teams/${teamId}`;
  const welcomeText = `أهلاً بكم في ${cleanTeamName}! يلا نذاكر ونتحدى بعض 💪`.slice(0, 300);

  try {
    await setDoc(doc(db, 'teams', teamId), {
      teamId,
      name: cleanTeamName,
      ownerUid: params.ownerUid,
      memberUids: uniqueMembers,
      lastMessageText: welcomeText,
      lastSenderUid: params.ownerUid,
      lastSenderName: safeOwnerName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, teamPath);
  }

  const msgId = `tm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const msgPath = `teams/${teamId}/messages/${msgId}`;
  try {
    await setDoc(doc(db, 'teams', teamId, 'messages', msgId), {
      senderUid: params.ownerUid,
      senderName: safeOwnerName,
      senderAvatar: safeOwnerAvatar,
      memberUids: uniqueMembers,
      type: 'text',
      text: welcomeText,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, msgPath);
  }

  return teamId;
}

export async function addMemberToStudyTeam(
  team: StudyTeam,
  newMemberUid: string,
  actorUid: string,
  actorName: string,
  newMemberName: string
): Promise<void> {
  if (team.ownerUid !== actorUid) return;
  if (team.memberUids.includes(newMemberUid) || team.memberUids.length >= 25) return;

  const updatedMembers = [...team.memberUids, newMemberUid].slice(0, 25);
  const teamPath = `teams/${team.teamId}`;
  const notice = `انضم ${sanitizeName(newMemberName)} إلى الفريق 🎉`.slice(0, 300);

  try {
    await updateDoc(doc(db, 'teams', team.teamId), {
      memberUids: updatedMembers,
      lastMessageText: notice,
      lastSenderUid: actorUid,
      lastSenderName: sanitizeName(actorName),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, teamPath);
  }
}

export async function deleteStudyTeam(teamId: string): Promise<void> {
  const teamPath = `teams/${teamId}`;
  try {
    await deleteDoc(doc(db, 'teams', teamId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, teamPath);
  }
}

export interface SendTeamMessageParams {
  team: StudyTeam;
  myUid: string;
  myName: string;
  myAvatar: string;
  type: TeamMessageType;
  text: string;
  quizId?: string;
  quizTitle?: string;
  subjectId?: SubjectId;
}

export async function sendTeamMessage(params: SendTeamMessageParams): Promise<void> {
  const { team, myUid } = params;
  const cleanText = params.text.trim().slice(0, 500);
  if (!cleanText || !myUid || !team.memberUids.includes(myUid)) return;

  const safeName = sanitizeName(params.myName);
  const safeAvatar = sanitizeAvatar(params.myAvatar);
  const previewText = cleanText.slice(0, 300);
  const teamPath = `teams/${team.teamId}`;

  try {
    await updateDoc(doc(db, 'teams', team.teamId), {
      lastMessageText: previewText,
      lastSenderUid: myUid,
      lastSenderName: safeName,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, teamPath);
  }

  const msgId = `tm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const msgPath = `teams/${team.teamId}/messages/${msgId}`;

  const msgPayload: Record<string, unknown> = {
    senderUid: myUid,
    senderName: safeName,
    senderAvatar: safeAvatar,
    memberUids: team.memberUids,
    type: params.type,
    text: cleanText,
    createdAt: serverTimestamp(),
  };

  if (params.quizId) msgPayload.quizId = params.quizId.slice(0, 80);
  if (params.quizTitle) msgPayload.quizTitle = params.quizTitle.slice(0, 120);
  if (params.subjectId) msgPayload.subjectId = params.subjectId.slice(0, 30);

  try {
    await setDoc(doc(db, 'teams', team.teamId, 'messages', msgId), msgPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, msgPath);
  }
}
