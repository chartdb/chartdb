# Proposal: Shared Diagrams for ChartDB via Firestore

## Context

ChartDB today is entirely local-first: `StorageProvider` (`src/context/storage-context/storage-provider.tsx`) wraps a Dexie/IndexedDB database, and every diagram, table, relationship, note, and area lives only in the browser that created it. There is no server component and no sharing mechanism beyond manual JSON export/import. Crucially, the storage layer is already abstracted behind a single `StorageContext` interface (`src/context/storage-context/storage-context.tsx`) that the rest of the app — `ChartDBProvider`, hooks, dialogs — talks to exclusively. Nothing in the UI layer knows it's talking to Dexie. That abstraction is the reason a Firestore-backed provider is a realistic, low-blast-radius change rather than a rewrite.

PR #908 tackled a similar goal (multi-device access, sharing) by replacing IndexedDB with a small Express server that reads and writes each diagram as one JSON file on a mounted Docker volume. It's worth understanding why that approach is a poor foundation for real sharing, so the Firestore design doesn't repeat the same mistakes. It stored each diagram as a single flat file, so any two people editing the same diagram at the same time would race on a whole-file read-modify-write and silently clobber each other's changes — there was no field- or entity-level granularity. It had no authentication or permission model at all: anyone who could reach the container and guess or receive a 12-character ID had full read/write access. And it depended on a stateful Docker volume, which reintroduces exactly the kind of infrastructure ChartDB has avoided by being a static, self-hostable frontend. The PR was closed without merging, and those three gaps are the ones this proposal is designed around.

## Approach: Firestore as a second `StorageContext` implementation, not a replacement

Rather than ripping out IndexedDB the way PR #908 ripped out local storage, add a `FirestoreStorageProvider` that implements the exact same `StorageContext` interface already used by Dexie. A diagram gets a `storageMode` of `local` or `cloud`; local diagrams behave exactly as they do today (fully offline, no account needed), and a diagram can be "promoted" to cloud storage when the user clicks Share, at which point its data is copied into Firestore and the provider for that diagram switches. This keeps the zero-signup, works-offline experience for anyone who doesn't need collaboration, while making sharing purely additive.

## Data model

Mirror the existing Dexie table structure rather than storing one JSON blob per diagram. Each diagram becomes a Firestore document at `diagrams/{diagramId}` holding just its top-level metadata (name, database type/edition, timestamps, owner), with each table, relationship, dependency, area, custom type, and note as its own document in a subcollection (`diagrams/{diagramId}/tables/{tableId}`, `.../relationships/{relId}`, etc.), keyed the same way the `id`/`diagramId` pairs already work in Dexie. This matters for concurrency: because `ChartDBProvider`'s existing add/update/delete operations already act on individual entities (see `addTable`, `updateRelationship`, and so on in `chartdb-provider.tsx`), each of those calls maps to a write on exactly one small document. Two people editing different tables in the same diagram never touch the same document, so Firestore's normal optimistic-concurrency writes are enough — no custom merge logic needed, unlike the single-file approach in PR #908.

Access control lives in a `diagrams/{diagramId}` field: an `ownerId`, an `editors: string[]` and `viewers: string[]` list of user IDs, plus an optional `shareLink: { token, role }` for anyone-with-the-link access. Firestore security rules enforce this directly (`request.auth.uid in resource.data.editors`), so permission checks never depend on client-side code being honest.

## Real-time collaboration for free

The reason Firestore is the right pick over "a database behind a REST API" (which is effectively what PR #908's Express server was) is `onSnapshot`. Subscribing to a diagram's subcollections gives every connected client live updates as other users edit, with no polling and no custom WebSocket server to run. The `StorageContext` methods that currently return a `Promise` and read once can stay as they are for one-shot loads; a thin addition — a `subscribeToDiagram(diagramId, onChange)` method — lets `ChartDBProvider` merge remote changes into React state the same way it already merges local undo/redo state. Firestore's SDK also does local caching and offline queuing out of the box, so a collaborator who loses connectivity keeps editing and reconciles automatically on reconnect — the same offline resilience ChartDB has today, but now with a sync target.

## Sharing UX

A "Share" button on a diagram opens a dialog offering an invite-by-email flow (adds a UID to `editors`/`viewers`, requires the invited user to sign in) and a "Anyone with the link can view/edit" toggle backed by the `shareLink` token, which is checked in security rules without requiring the visitor to have an account. This covers both the "share with my team" and the "send a read-only link" cases people asked for in the PR #908 thread, without the all-or-nothing exposure that PR had.

## Auth and infra footprint

Firestore needs some notion of identity to make `editors`/`viewers` meaningful, so this proposal pulls in Firebase Authentication (anonymous auth is enough for the link-based share case; Google/GitHub/email sign-in for persistent accounts). The app itself keeps deploying exactly as it does now — static build served from any host or the existing Docker image — the only new dependency is a Firebase project (Firestore + Auth), which is serverless and requires no volume or container to operate, unlike PR #908's stateful `/data` mount.

## Migration path

1. Add the Firestore SDK and a `FirestoreStorageProvider` alongside the existing Dexie one; feature-flag it off by default.
2. Add `storageMode` to the `Diagram` domain type and route reads/writes through whichever provider matches the diagram.
3. Ship the Share dialog and security rules together, since one is useless without the other.
4. Add `subscribeToDiagram` and wire it into `ChartDBProvider` so cloud diagrams re-render on remote changes.
5. Existing local diagrams are unaffected; "Share" becomes the one-way door that copies a diagram's Dexie rows into the Firestore document/subcollection structure described above.

## Open questions worth resolving before implementation

Conflict resolution is only solved at the entity level (two people editing the *same* table's fields simultaneously will still last-write-win on that document) — worth deciding whether that's acceptable for v1 or needs field-level merge. Cursor/presence indicators are not covered here and would be a separate, smaller feature on top of this data model. And a decision is needed on whether self-hosters without a Firebase account should still get the full app (yes, via the `local` mode remaining the default) or whether cloud mode requires them to configure their own Firebase project via env vars, similar to how optional AI features are already gated behind an API key.
