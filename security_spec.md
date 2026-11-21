# Security Specification: TOP1 Friends, Requests & Study Teams

## 1. Data Invariants
1. **PII Isolation**: User email addresses exist exclusively in `/users/{userId}` and are readable/writable only by `request.auth.uid == userId`. Neither `/profiles`, `/friendCodes`, `/friendRequests`, `/chats`, `/teams`, nor `/messages` may store PII.
2. **Discoverable Public Profiles (Non-PII)**: Authenticated students can list `/profiles` strictly where `isDiscoverable == true`, exposing only display name, avatar, friend code, and study points/streaks (zero email or private PII).
3. **Friend Code Ownership**: A `/friendCodes/{code}` document can only be created or updated by the authenticated verified user whose UID matches `uid`, preventing hijacking of another student's friend code.
4. **Friend Request State Machine**: `/friendRequests/{requestId}` requires `requestId == fromUid + '_' + toUid`, creation only by `fromUid == request.auth.uid` with `status == 'pending'`, and status transitions (`pending` -> `accepted` | `declined`) exclusively by the recipient `toUid`.
5. **Participant-Bound 1-on-1 & Team Chats**: `/chats/{chatId}` enforces 2 distinct participants. `/teams/{teamId}` enforces bounded `memberUids` (1..25), Tier 1 owner permissions for team naming/membership/deletion, and Tier 2 member permissions for posting message previews only.
6. **Master Gate & Immutability for Messages**: Every `/chats/{chatId}/messages/{messageId}` and `/teams/{teamId}/messages/{messageId}` write verifies parent existence and identical `participants`/`memberUids` via `get()`, enforces `senderUid == request.auth.uid`, uses `request.auth.uid in resource.data.memberUids` for zero-`get()` `list` queries, and forbids updates or deletes (`allow update, delete: if false;`).
7. **Server Timestamp & Numeric Bounds**: All `createdAt`, `updatedAt`, and `addedAt` fields must equal `request.time`; `points`, `streakDays`, `completedCount`, `score`, and `total` are strictly bounded integers.

## 2. Attack Payloads Blocked (Expected: PERMISSION_DENIED)
1. **PII Snooping (`get /users/otherUid`)**: Signed-in user reads another student's `/users/{userId}` doc to harvest email -> DENIED (`isOwner` fails).
2. **Private User Scraping (`list /users`)**: User attempts `getDocs(collection(db, 'users'))` -> DENIED (`allow list: if false`).
3. **Friend Request Spoofing (`create /friendRequests/other_target` with `fromUid: other`)**: Fails `incoming().fromUid == request.auth.uid` -> DENIED.
4. **Self-Accepting Own Outgoing Request (`update /friendRequests/my_other` by `myUid`)**: Only `existing().toUid` can accept/decline -> DENIED.
5. **Shadow Field Injection on Profile/Request/Team**: Extra unexpected field -> DENIED (`hasOnly` check fails).
6. **UID Spoofing on Profile (`create /profiles/victimUid` with `uid: myUid`)**: Path `userId != request.auth.uid` -> DENIED.
7. **Point Inflation Overflow (`update /profiles/myUid` with `points: 999999999`)**: Exceeds upper bound `100000` -> DENIED.
8. **Fake Timestamp Forgery (`create /teams/{id}/messages/{m}` with client date)**: `createdAt != request.time` -> DENIED.
9. **Team Member Hijack by Non-Owner (`update /teams/{id}` by member changing `memberUids`)**: Tier 2 restricts non-owners to preview fields only -> DENIED.
10. **Non-Member Team Message Injection (`create /teams/{id}/messages/{m}` by `outsider`)**: `outsider` not in parent `team.memberUids` -> DENIED.
11. **Chat Participant Hijack (`update /chats/u1_u2` adding `u3` to `participants`)**: `affectedKeys().hasOnly(...)` excludes `participants` and `chatId` -> DENIED.
12. **Message Tampering / Forgery (`update` or `delete` on any message)**: Messages are immutable -> DENIED.

