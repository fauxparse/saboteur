import { getApps, initializeApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/logger";
import { deleteExpiredMission, listExpiredMissions } from "./retention.js";

const PRODUCTION_DATABASE_URL =
  "https://thesaboteur-default-rtdb.asia-southeast1.firebaseddatabase.app";

const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG || "{}");
const projectId =
  firebaseConfig.projectId || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
const databaseURL =
  firebaseConfig.databaseURL ||
  process.env.FIREBASE_DATABASEURL ||
  (projectId === "thesaboteur" ? PRODUCTION_DATABASE_URL : undefined);

if (!databaseURL) {
  throw new Error("Set FIREBASE_CONFIG.databaseURL or FIREBASE_DATABASEURL for this project");
}

if (getApps().length === 0) {
  initializeApp({ ...firebaseConfig, projectId, databaseURL });
}

const firestore = getFirestore();
const realtime = getDatabase();

// Scheduled invocation time keeps the cutoff consistent despite late starts;
// falls back to wall-clock when absent or unparseable.
function invocationTime(event) {
  const raw = event?.scheduleTime;
  if (typeof raw === "string") {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export const cleanupExpiredMissions = onSchedule(
  {
    schedule: "0 3 * * 1",
    timeZone: "UTC",
    region: "asia-southeast1",
    maxInstances: 1,
    concurrency: 1,
    timeoutSeconds: 540,
    memory: "256MiB",
  },
  async (event) => {
    const startedAt = Date.now();
    const now = invocationTime(event);

    const expired = await listExpiredMissions(firestore, now);
    let deleted = 0;
    const failures = [];
    for (const mission of expired) {
      try {
        if (await deleteExpiredMission({ firestore, realtime, mission, now })) {
          deleted += 1;
        }
      } catch (error) {
        failures.push(mission.id);
        logger.error("cleanupExpiredMissions: deletion failed", {
          missionId: mission.id,
          error: String(error),
        });
      }
    }

    if (deleted > 0 || failures.length > 0) {
      logger.info("cleanupExpiredMissions: run finished", {
        deleted,
        failed: failures.length,
        failedMissionIds: failures,
        elapsedMs: Date.now() - startedAt,
      });
    }
    if (failures.length > 0) {
      throw new Error(
        `cleanupExpiredMissions: ${failures.length} deletion(s) failed: ${failures.join(", ")}`
      );
    }
  }
);

const MISSION_TIMEOUT_MS = 6 * 60 * 60 * 1000;

export const autoEndStaleMissions = onSchedule(
  {
    schedule: "0 */3 * * *",
    timeZone: "UTC",
    region: "us-central1",
  },
  async () => {
    const cutoff = Date.now() - MISSION_TIMEOUT_MS;
    const runningMissions = await firestore
      .collection("missions")
      .where("startsAt", "!=", null)
      .where("endsAt", "==", null)
      .get();

    for (const mission of runningMissions.docs) {
      const startsAt = mission.get("startsAt");
      if (!startsAt || startsAt.toMillis() > cutoff) continue;

      const activeQuizzes = await mission.ref
        .collection("events")
        .where("type", "==", "quiz")
        .where("startsAt", "!=", null)
        .where("endsAt", "==", null)
        .get();

      const batch = firestore.batch();
      for (const quiz of activeQuizzes.docs) {
        batch.update(quiz.ref, { endsAt: Timestamp.now() });
      }
      batch.update(mission.ref, { endsAt: Timestamp.now() });
      await batch.commit();
    }
  },
);
