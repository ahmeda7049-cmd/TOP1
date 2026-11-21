# Security Specification: TOP1 Friends & Challenges

## 1. Data Invariants
1. **PII Isolation**: User email addresses exist exclusively in `/users/{userId}` and are readable/writable only by `request.auth.uid == userId`. Neither `/profiles`, `/friendCodes`, `/chats`, nor `/messages` may store PII.
2. **Friend Code Ownership**: A `/friendCodes/{code}` document can only be created or updated by the authenticated verified user whose UID matches `uid`, preventing hijacking of another student's friend code.
3. **Participant-Bound Messaging**: A `/chats/{chatId}` document strictly has `participants.size() == 2` with distinct existing student profiles (`participants[0] < participants[1]` and `chatId == participants[0] + '_' + participants[1]`). Only those two participants can read or update the chat.
4. **Master Gate & Immutability for Messages**: Every `/chats/{chatId}/messages/{messageId}` write verifies parent chat existence and identical `participants` array via `get()`, enforces `senderUid == request.auth.uid`, and forbids updates or deletes (`allow update, delete: if false;`).
5. **Server Timestamp & Numeric Bounds**: All `createdAt`, `updatedAt`, and `addedAt` fields must equal `request.time`; `points`, `streakDays`, `completedCount`, `score`, and `total` are strictly bounded integers.

## 2. The "Dirty Dozen" Attack Payloads (Expected: PERMISSION_DENIED)
1. **PII Snooping (`get /users/otherUid`)**: Signed-in user reads another student's `/users/{userId}` doc to harvest email -> DENIED (`isOwner` fails).
2. **Blanket User Scraping (`list /users` or `list /profiles`)**: User attempts `getDocs(collection(db, 'profiles'))` -> DENIED (`allow list: if false`).
3. **Friend Code Hijacking (`create/update /friendCodes/OTHER1` with existing code)**: Attacker tries to overwrite a friend's code with their own `uid` -> DENIED (`existing().uid == request.auth.uid` fails on update).
4. **Shadow Field Injection on Profile (`create /profiles/myUid` with `isAdmin: true`)**: Attacker sends extra field -> DENIED (`hasOnly` check fails).
5. **UID Spoofing on Profile (`create /profiles/victimUid` with `uid: myUid`)**: Path `userId != request.auth.uid` -> DENIED.
6. **Point Inflation Overflow (`update /profiles/myUid` with `points: 999999999`)**: Exceeds upper bound `100000` -> DENIED.
7. **Immutable Field Tampering (`update /users/myUid` changing `createdAt` or `uid`)**: `incoming().createdAt == existing().createdAt` fails -> DENIED.
8. **Fake Timestamp Forgery (`create /chats/{id}/messages/{m}` with client date)**: `createdAt != request.time` -> DENIED.
9. **Orphan Chat Creation (`create /chats/myUid_ghostUid` where `ghostUid` has no profile)**: `exists(/profiles/ghostUid)` fails -> DENIED.
10. **Non-Participant Message Injection (`create /chats/u1_u2/messages/m1` by `u3`)**: `u3` not in parent `chat.participants` -> DENIED.
11. **Chat Participant Hijack (`update /chats/u1_u2` adding `u3` to `participants`)**: `affectedKeys().hasOnly(...)` excludes `participants` and `chatId` -> DENIED.
12. **Message Tampering / Forgery (`update` or `delete` on `/chats/u1_u2/messages/m1`)**: Messages are immutable -> DENIED.
