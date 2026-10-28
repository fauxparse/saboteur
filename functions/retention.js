// Mission retention policy and deletion, shared by index.js (weekly cron) and
// cleanup-cli.js (one-off cleanup). Quiz events (type: "quiz") keep live vote
// totals in the Realtime Database under quizzes/{eventId}; uploads are
// embedded base64 in agent docs, so there are no Storage files to remove.

import { FieldPath } from "firebase-admin/firestore";

/** Deletable only when strictly older than 30*24h. */
export const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/** Page size for collection scans. */
export const PAGE_SIZE = 100;

// Normalizes a date-ish value. Returns:
//   null      -> field absent
//   undefined -> malformed (unsafe to act on)
//   Date      -> usable
// Accepts Firebase Timestamps (toDate()), JS Dates, and Timestamp-like objects.
function asDate(value) {
  if (value === null || value === undefined) return null;
  let date;
  try {
    date =
      value instanceof Date
        ? value
        : typeof value.toDate === "function"
          ? value.toDate()
          : null;
  } catch {
    return undefined;
  }
  if (!(date instanceof Date)) return undefined;
  return Number.isFinite(date.getTime()) ? date : undefined;
}

/**
 * Pure policy: deletable when endsAt, or for drafts (startsAt/endsAt null or
 * missing) the Firestore createTime, is strictly older than 30*24h before
 * `now`. Running (startsAt set, no end) and future missions are never expired.
 * Any malformed date field, invalid `now`, or draft without createTime
 * returns false: never delete on bad data.
 */
export function isMissionExpired(data, createTime, now = new Date()) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return false;
  }
  const nowDate = asDate(now);
  if (nowDate === null || nowDate === undefined) return false;

  const endsAt = asDate(data.endsAt);
  if (endsAt === undefined) return false;
  const startsAt = asDate(data.startsAt);
  if (startsAt === undefined) return false;

  const cutoff = nowDate.getTime() - RETENTION_MS;
  if (endsAt !== null) return endsAt.getTime() < cutoff;
  if (startsAt !== null) return false;

  const created = asDate(createTime);
  return created !== null && created !== undefined && created.getTime() < cutoff;
}

/** Scans missions with ID-order pagination; no field projection (docs are tiny). */
export async function listExpiredMissions(firestore, now = new Date(), pageSize = PAGE_SIZE) {
  const expired = [];
  let cursor = null;
  for (;;) {
    let query = firestore
      .collection("missions")
      .orderBy(FieldPath.documentId())
      .limit(pageSize);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    for (const mission of page.docs) {
      if (isMissionExpired(mission.data(), mission.createTime, now)) {
        expired.push(mission);
      }
    }
    if (page.docs.length < pageSize) break;
    cursor = page.docs[page.docs.length - 1];
  }
  return expired;
}

// All quiz event IDs are read before anything is deleted, so realtime totals
// can be removed even after the events themselves are gone.
async function listQuizEventIds(missionRef) {
  const ids = [];
  let cursor = null;
  for (;;) {
    let query = missionRef
      .collection("events")
      .orderBy(FieldPath.documentId())
      .limit(PAGE_SIZE);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    for (const event of page.docs) {
      if (event.get("type") === "quiz") ids.push(event.id);
    }
    if (page.docs.length < PAGE_SIZE) break;
    cursor = page.docs[page.docs.length - 1];
  }
  return ids;
}

/**
 * Re-reads the mission and deletes it only if still eligible: re-check
 * policy, read all quiz event IDs, remove their /quizzes/{eventId} realtime
 * totals, then delete root-last — recursiveDelete each child collection
 * first (agents, events, questions, answers, responses, and any unknown
 * subcollections), and only then the mission doc, guarded by lastUpdateTime.
 * A failed child subtree leaves the doc in place so the next scan retries it;
 * the root never disappears while descendants remain. Returns true if
 * deleted, false if the latest document no longer exists or is no longer
 * eligible. Throws on failure; `realtime` is required so vote cleanup can
 * never be silently skipped.
 */
export async function deleteExpiredMission({ firestore, realtime, mission, now = new Date() }) {
  if (!realtime) {
    throw new Error("deleteExpiredMission: realtime database instance is required");
  }

  const latest = await mission.ref.get();
  if (!latest.exists) return false;
  if (!isMissionExpired(latest.data(), latest.createTime, now)) return false;

  const quizEventIds = await listQuizEventIds(latest.ref);
  await Promise.all(
    quizEventIds.map((eventId) => realtime.ref(`quizzes/${eventId}`).remove())
  );

  for (const collection of await latest.ref.listCollections()) {
    await firestore.recursiveDelete(collection);
  }
  const precondition = latest.updateTime ? { lastUpdateTime: latest.updateTime } : undefined;
  await latest.ref.delete(precondition);
  return true;
}
