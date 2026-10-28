#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const SCHEMA_ID = 'saboteur-mission-backup/1';
const KNOWN_DATABASE_URLS = {
  thesaboteur: 'https://thesaboteur-default-rtdb.asia-southeast1.firebasedatabase.app',
};

const SCHEMA_NOTES = `
Backup artifact schema "${SCHEMA_ID}" (single JSON object, sufficient to restore):
Top level:
  schema, createdAt, generatedBy, node, project, databaseUrl, realtimeNamespace, now,
  missionCount, totalDocuments, totalRealtimePaths, schemaNotes, missions[].
missions[] (one per deleted-candidate mission):
  missionPath ("missions/<id>"), missionId, documentCount, realtimeCount,
  eligibility { basis: "endsAt"|"createTime", endsAt, startsAt, createTime, evaluatedAt },
  documents[], realtime[].
documents[] (full recursive subtree, INCLUDING "ghost" documents with exists=false whose
  subcollections outlived their parent doc — discovered via listCollections/listDocuments):
  path   — even-length collection/document path, e.g. "missions/<id>/events/<id>/questions/<q>/answers/<a>"
  id     — Firestore document id
  exists — false for ghost documents (no fields/times recorded, children still present)
  createTime, updateTime — RFC3339 UTC with up to nanosecond precision
  fields — document body as Firestore REST Document.fields Value objects
           (https://firebase.google.com/docs/firestore/reference/rest/v1/Document#Value):
           nullValue | booleanValue | integerValue (decimal string) | doubleValue |
           stringValue | bytesValue (base64) | timestampValue (RFC3339) |
           referenceValue ("projects/<p>/databases/(default)/documents/<path>") |
           geoPointValue {latitude, longitude} | arrayValue {values[]} | mapValue {fields{}}.
realtime[] (vote totals for every quiz event in the subtree):
  { path: "quizzes/<quizId>", exists: boolean, value: <JSON value or null> }.
Restore: PATCH each existing documents[] entry's fields to its document path using
  the Firestore REST API, then PUT each realtime[] value back to its path. Do not
  create exists=false parent documents. Original createTime/updateTime are audit
  metadata; restored documents receive new server timestamps.
`;

class UsageError extends Error {}

/* ------------------------------- arguments ------------------------------- */

function parseArgs(argv) {
  const stringFlags = new Set(['--project', '--backup', '--database-url', '--now']);
  const booleanFlags = new Set(['--apply', '--help', '-h']);
  const camel = {
    '--project': 'project',
    '--backup': 'backup',
    '--database-url': 'databaseUrl',
    '--now': 'now',
    '--apply': 'apply',
    '--help': 'help',
    '-h': 'help',
  };
  const parsed = { apply: false, help: false };
  const seen = new Set();

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const eq = token.startsWith('--') ? token.indexOf('=') : -1;
    const flag = eq >= 0 ? token.slice(0, eq) : token;
    const inline = eq >= 0 ? token.slice(eq + 1) : undefined;

    if (!stringFlags.has(flag) && !booleanFlags.has(flag)) {
      throw new UsageError(`unknown argument "${token}"`);
    }
    const key = camel[flag];
    if (seen.has(key)) throw new UsageError(`${flag} supplied more than once`);
    seen.add(key);

    if (booleanFlags.has(flag)) {
      if (inline !== undefined) throw new UsageError(`${flag} does not accept a value`);
      parsed[key] = true;
      continue;
    }
    let value = inline;
    if (value === undefined) {
      if (i + 1 >= argv.length) throw new UsageError(`${flag} requires a value`);
      value = argv[i + 1];
      i += 1;
    }
    if (!value || value.startsWith('--')) {
      throw new UsageError(`${flag} requires a value (got "${value}")`);
    }
    parsed[key] = value;
  }
  return parsed;
}

function validateOptions(options) {
  if (options.help) return;
  if (!options.project) throw new UsageError('--project <id> is required');
  if (!/^[a-z][a-z0-9-]{2,29}$/.test(options.project)) {
    throw new UsageError(`--project "${options.project}" does not look like a Firebase project id`);
  }
  if (options.apply && !options.backup) {
    throw new UsageError('--apply requires --backup <path> (deletes never happen without a backup)');
  }
  if (options.backup && !options.apply) {
    throw new UsageError('--backup only makes sense together with --apply (dry runs never write a backup)');
  }
  if (options.now && Number.isNaN(Date.parse(options.now))) {
    throw new UsageError(`--now "${options.now}" is not a valid ISO-8601 timestamp`);
  }
}

function printUsage() {
  console.log(`Usage:
  node functions/cleanup-cli.js --project <id> [options]

Modes:
  (default)  Dry run: print missions the retention policy would delete. No writes, no backup.
  --apply    Back up every selected mission subtree + realtime quiz totals into one new
             artifact, revalidate, then delete eligible missions.

Options:
  --project <id>         Required. Firebase project id (e.g. thesaboteur).
  --apply                Perform the destructive run. Requires --backup.
  --backup <path>        Required with --apply. New file outside this repository; created
                         exclusively (never overwritten) with mode 0600.
  --database-url <url>   Realtime Database URL. Defaults to the known production instance
                         only for --project thesaboteur; any other project must pass it
                         explicitly (e.g. emulator: http://localhost:9000?ns=<namespace>).
  --now <iso8601>        Optional deterministic clock passed to the retention helpers
                         (include Z or an offset for full determinism).
  -h, --help             Show this help.

Credentials (never logged or written anywhere):
  1. ADC:                       gcloud auth application-default login
  2. Service account key:       GOOGLE_APPLICATION_CREDENTIALS=<key.json>
  3. Temporary OAuth token:     GOOGLE_OAUTH_ACCESS_TOKEN=<token>
  4. Local emulators:           FIRESTORE_EMULATOR_HOST + FIREBASE_DATABASE_EMULATOR_HOST`);
}

/* ------------------------------ backup path ------------------------------ */

function prepareBackupPath(rawPath) {
  const absolute = path.resolve(rawPath);
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  if (absolute === repoRoot || absolute.startsWith(`${repoRoot}${path.sep}`)) {
    throw new UsageError(`backup path must be outside the repository (${repoRoot}); got ${absolute}`);
  }
  let existing = null;
  try {
    existing = fs.lstatSync(absolute);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  if (existing) {
    const kind = existing.isDirectory() ? 'directory' : existing.isSymbolicLink() ? 'symlink' : 'file';
    throw new UsageError(`backup path already exists (${kind}); this tool never overwrites a backup: ${absolute}`);
  }
  const parent = path.dirname(absolute);
  let parentStats = null;
  try {
    parentStats = fs.statSync(parent);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  if (!parentStats || !parentStats.isDirectory()) {
    throw new UsageError(`backup parent directory does not exist: ${parent}`);
  }
  return absolute;
}

/**
 * Atomic + exclusive artifact write: content is fsynced to a 0600 temp file in the
 * target directory, then hard-linked into place (link(2) fails with EEXIST if the
 * target path became occupied meanwhile), then the temp name is dropped. The final
 * path therefore only ever springs into existence complete.
 */
function writeBackupArtifact(filePath, artifact) {
  const contents = JSON.stringify(artifact);
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  let fd = null;
  try {
    fd = fs.openSync(tempPath, 'wx', 0o600);
    fs.writeFileSync(fd, contents);
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = null;
    fs.chmodSync(tempPath, 0o600);
    try {
      fs.linkSync(tempPath, filePath);
    } catch (err) {
      if (err.code === 'EEXIST') {
        throw new UsageError(`backup path already exists, refusing to overwrite: ${filePath}`);
      }
      throw err;
    }
    fs.unlinkSync(tempPath);
    try {
      const dirFd = fs.openSync(path.dirname(filePath), 'r');
      fs.fsyncSync(dirFd);
      fs.closeSync(dirFd);
    } catch {
      // directory fsync is best-effort (not supported on every filesystem)
    }
  } catch (err) {
    if (fd !== null) {
      try {
        fs.closeSync(fd);
      } catch {}
    }
    try {
      fs.unlinkSync(tempPath);
    } catch {}
    throw err;
  }
  return Buffer.byteLength(contents);
}

/* --------------------------- value serialization -------------------------- */
function formatTimestamp(ts) {
  if (ts == null) return null;
  const seconds = Number(ts.seconds ?? ts._seconds);
  const nanoseconds = Number(ts.nanoseconds ?? ts._nanoseconds);
  if (!Number.isFinite(seconds) || !Number.isFinite(nanoseconds)) return null;
  const base = new Date(seconds * 1000).toISOString().slice(0, 19);
  const fraction = `${Math.abs(nanoseconds)}`.padStart(9, '0').replace(/0+$/, '');
  return fraction ? `${base}.${fraction}Z` : `${base}Z`;
}

function toIso(value) {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toDate === 'function') return formatTimestamp(value);
  return null;
}

function createDocumentReader(project, credential) {
  const emulator = process.env.FIRESTORE_EMULATOR_HOST;
  const origin = emulator ? `http://${emulator}` : 'https://firestore.googleapis.com';
  return async (ref) => {
    const documentPath = ref.path.split('/').map(encodeURIComponent).join('/');
    const headers = emulator
      ? {}
      : { Authorization: `Bearer ${(await credential.getAccessToken()).access_token}` };
    const response = await fetch(
      `${origin}/v1/projects/${project}/databases/(default)/documents/${documentPath}`,
      { headers },
    );
    const entry = { path: ref.path, id: ref.id, exists: response.ok };
    if (response.status === 404) return entry;
    if (!response.ok) {
      throw new Error(`Failed to back up ${ref.path}: HTTP ${response.status}`);
    }
    const document = await response.json();
    return {
      ...entry,
      createTime: document.createTime,
      updateTime: document.updateTime,
      fields: document.fields ?? {},
    };
  };
}


/* ------------------------------ subtree walk ------------------------------ */

/**
 * Recursive subtree capture using listCollections() + listDocuments() (not queries),
 * so subcollections of missing/ghost parent documents are still discovered and backed up.
 */
async function collectSubtree(docRef, readDocument) {
  const documents = [];
  const pending = [docRef];
  for (let offset = 0; offset < pending.length;) {
    const batch = await Promise.all(
      pending.slice(offset, offset + 20).map(async (ref) => {
        const [document, collections] = await Promise.all([
          readDocument(ref),
          ref.listCollections(),
        ]);
        const children = await Promise.all(collections.map((collection) => collection.listDocuments()));
        return { document, children: children.flat() };
      }),
    );
    offset += batch.length;
    for (const { document, children } of batch) {
      documents.push(document);
      pending.push(...children);
    }
  }
  return documents.sort((a, b) => a.path.localeCompare(b.path));
}

async function collectRealtimeQuizzes(realtime, documents) {
  const entries = [];
  for (const doc of documents) {
    if (!doc.exists) continue;
    const parts = doc.path.split('/');
    if (parts.length !== 4 || parts[0] !== 'missions' || parts[2] !== 'events') continue;
    if (doc.fields?.type?.stringValue !== 'quiz') continue;
    const quizPath = `quizzes/${parts[3]}`;
    const snapshot = await realtime.ref(quizPath).get();
    entries.push({
      path: quizPath,
      exists: snapshot.exists(),
      value: snapshot.exists() ? snapshot.val() : null,
    });
  }
  return entries;
}

/** Re-walk the subtree and confirm it is byte-for-byte what was backed up. */
async function verifySubtreeUnchanged(docRef, backedUpDocuments, readDocument) {
  const current = await collectSubtree(docRef, readDocument);
  const previous = new Map(backedUpDocuments.map((doc) => [doc.path, doc]));
  if (current.length !== previous.size) return false;
  for (const doc of current) {
    const before = previous.get(doc.path);
    if (!before) return false;
    if (doc.exists !== before.exists) return false;
    if (doc.exists && doc.updateTime !== before.updateTime) return false;
  }
  return true;
}

/* --------------------------------- admin --------------------------------- */

async function loadDependencies() {
  const [appModule, retention] = await Promise.all([import('firebase-admin/app'), import('./retention.js')]);
  return {
    applicationDefault: appModule.applicationDefault,
    deleteApp: appModule.deleteApp,
    initializeApp: appModule.initializeApp,
    deleteExpiredMission: retention.deleteExpiredMission,
    isMissionExpired: retention.isMissionExpired,
    listExpiredMissions: retention.listExpiredMissions,
  };
}

async function createClients(deps, project, databaseUrl) {
  const accessToken = process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
  if (accessToken) {
    const [{ GoogleAuth, OAuth2Client }, { Firestore }, { getDatabase }] = await Promise.all([
      import('google-auth-library'),
      import('firebase-admin/firestore'),
      import('firebase-admin/database'),
    ]);
    const oauth2Client = new OAuth2Client();
    oauth2Client.setCredentials({
      access_token: accessToken,
      expiry_date: Date.now() + 3_000_000, // ~50min: trust a typical 1h gcloud token for the run
    });
    const firestore = new Firestore({
      projectId: project,
      auth: new GoogleAuth({ projectId: project, authClient: oauth2Client }),
    });
    const app = deps.initializeApp({
      projectId: project,
      databaseURL: databaseUrl,
      credential: { getAccessToken: async () => ({ access_token: accessToken, expires_in: 3000 }) },
    });
    console.log('credential: temporary OAuth access token');
    return {
      firestore,
      readDocument: createDocumentReader(project, app.options.credential),
      realtime: getDatabase(app),
      close: async () => {
        await Promise.allSettled([deps.deleteApp(app), firestore.terminate()]);
      },
    };
  }

  const adcFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const emulator =
    Boolean(process.env.FIRESTORE_EMULATOR_HOST) || Boolean(process.env.FIREBASE_DATABASE_EMULATOR_HOST);
  const credential = deps.applicationDefault(); // lazy constructor, never throws here
  if (!emulator) {
    try {
      await credential.getAccessToken(); // fail fast with guidance before any real work
    } catch (err) {
      throw new Error(
        `no usable credential: ${err.message}. Either (1) run \`gcloud auth application-default login\`, ` +
          '(2) set GOOGLE_APPLICATION_CREDENTIALS to a service account key, (3) export a temporary ' +
          'GOOGLE_OAUTH_ACCESS_TOKEN, or (4) point FIRESTORE_EMULATOR_HOST and ' +
          'FIREBASE_DATABASE_EMULATOR_HOST at local emulators.',
      );
    }
  }
  const app = deps.initializeApp({ projectId: project, databaseURL: databaseUrl, credential });
  console.log(
    emulator
      ? `credential: emulator mode (FIRESTORE_EMULATOR_HOST=${process.env.FIRESTORE_EMULATOR_HOST ?? '-'}, FIREBASE_DATABASE_EMULATOR_HOST=${process.env.FIREBASE_DATABASE_EMULATOR_HOST ?? '-'}), auth bypassed`
      : adcFile
        ? `credential: ADC via GOOGLE_APPLICATION_CREDENTIALS=${adcFile}`
        : 'credential: application default credentials',
  );
  const [{ getFirestore }, { getDatabase }] = await Promise.all([
    import('firebase-admin/firestore'),
    import('firebase-admin/database'),
  ]);
  return {
    firestore: getFirestore(app),
    readDocument: createDocumentReader(project, credential),
    realtime: getDatabase(app),
    close: async () => {
      await deps.deleteApp(app).catch(() => {});
    },
  };
}

function resolveDatabaseUrl(options) {
  const url = options.databaseUrl ?? KNOWN_DATABASE_URLS[options.project];
  if (!url) {
    throw new UsageError(
      `no known Realtime Database URL for project "${options.project}". ` +
        'Pass --database-url explicitly (production URL, or emulator form http://localhost:9000?ns=<namespace>). ' +
        'This tool never guesses and never routes an unknown project to a production database.',
    );
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new UsageError(`--database-url is not a valid URL: ${url}`);
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new UsageError(`--database-url must be an http(s) URL: ${url}`);
  }
  return url;
}

function realtimeNamespaceOf(databaseUrl) {
  const parsed = new URL(databaseUrl);
  const ns = parsed.searchParams.get('ns');
  return ns ?? parsed.hostname.split('.')[0];
}

/* --------------------------------- report --------------------------------- */

function missionEligibility(mission, now) {
  const data = mission.data() ?? {};
  return {
    basis: data.endsAt != null ? 'endsAt' : 'createTime',
    endsAt: toIso(data.endsAt),
    startsAt: toIso(data.startsAt),
    createTime: formatTimestamp(mission.createTime),
    evaluatedAt: now.toISOString(),
  };
}

function dryRunReport(missions, now) {
  console.log('\nDry run: nothing is written or deleted; no backup is created.');
  console.log(`now: ${now.toISOString()}`);
  console.log(`\n${missions.length} expired mission(s) selected by the retention policy:\n`);
  for (const mission of missions) {
    const e = missionEligibility(mission, now);
    const basis =
      e.basis === 'endsAt'
        ? `completed, ended ${e.endsAt}`
        : e.startsAt
          ? `started (never ended), created ${e.createTime}`
          : `never started, created ${e.createTime}`;
    console.log(`  ${mission.ref.path}  [${basis}]`);
  }
  console.log(`\ncount: ${missions.length}`);
  console.log('To back up and delete, rerun with: --apply --backup <new-path-outside-this-repo>');
}

/* ---------------------------------- main ---------------------------------- */

async function buildBackupArtifact({ firestore, realtime, readDocument, missions, now, project, databaseUrl }) {
  const entries = [];
  for (const [index, mission] of missions.entries()) {
    const documents = await collectSubtree(mission.ref, readDocument);
    const realtimeEntries = await collectRealtimeQuizzes(realtime, documents);
    entries.push({
      missionPath: mission.ref.path,
      missionId: mission.ref.id,
      eligibility: missionEligibility(mission, now),
      documentCount: documents.length,
      documents,
      realtimeCount: realtimeEntries.length,
      realtime: realtimeEntries,
    });
    console.log(
      `  [backup ${index + 1}/${missions.length}] ${mission.ref.path}: ${documents.length} Firestore document(s), ${realtimeEntries.length} realtime path(s)`,
    );
  }
  return {
    schema: SCHEMA_ID,
    createdAt: new Date().toISOString(),
    generatedBy: 'functions/cleanup-cli.js',
    node: process.version,
    project,
    databaseUrl,
    realtimeNamespace: realtimeNamespaceOf(databaseUrl),
    now: now.toISOString(),
    missionCount: entries.length,
    totalDocuments: entries.reduce((total, entry) => total + entry.documentCount, 0),
    totalRealtimePaths: entries.reduce((total, entry) => total + entry.realtimeCount, 0),
    schemaNotes: SCHEMA_NOTES.trim(),
    missions: entries,
  };
}

async function applyDeletions({ deps, firestore, realtime, readDocument, missions, artifact, now }) {
  const entryByPath = new Map(artifact.missions.map((entry) => [entry.missionPath, entry]));
  let deleted = 0;
  let failed = 0;
  const skipped = { noLongerEligible: 0, changedSinceBackup: 0, deleteRecheck: 0 };
  const total = missions.length;

  console.log('\nRevalidating missions against live data before deleting...');
  for (const [index, mission] of missions.entries()) {
    const label = mission.ref.path;
    const latest = await mission.ref.get();
    const eligible = latest.exists && deps.isMissionExpired(latest.data() ?? {}, latest.createTime, now);
    if (!eligible) {
      skipped.noLongerEligible += 1;
      console.log(`  [delete ${index + 1}/${total}] ${label}: SKIPPED (mission no longer eligible on revalidation)`);
      continue;
    }
    const entry = entryByPath.get(label);
    const unchanged = entry != null && (await verifySubtreeUnchanged(mission.ref, entry.documents, readDocument));
    if (!unchanged || !isDeepStrictEqual(await collectRealtimeQuizzes(realtime, entry.documents), entry.realtime)) {
      skipped.changedSinceBackup += 1;
      console.log(`  [delete ${index + 1}/${total}] ${label}: SKIPPED (subtree changed since backup)`);
      continue;
    }
    try {
      const didDelete = await deps.deleteExpiredMission({ firestore, realtime, mission, now });
      if (didDelete) {
        deleted += 1;
        console.log(`  [delete ${index + 1}/${total}] ${label}: deleted`);
      } else {
        skipped.deleteRecheck += 1;
        console.log(`  [delete ${index + 1}/${total}] ${label}: SKIPPED (deleteExpiredMission recheck said no)`);
      }
    } catch (err) {
      failed += 1;
      console.log(`  [delete ${index + 1}/${total}] ${label}: FAILED (${err.message})`);
    }
  }

  const skippedTotal = skipped.noLongerEligible + skipped.changedSinceBackup + skipped.deleteRecheck;
  console.log(
    `\nSummary: selected=${total} deleted=${deleted} skipped=${skippedTotal} failed=${failed}` +
      ` (skipped: noLongerEligible=${skipped.noLongerEligible}, changedSinceBackup=${skipped.changedSinceBackup}, deleteRecheck=${skipped.deleteRecheck})`,
  );
  return failed > 0 ? 1 : 0;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return 0;
  }
  validateOptions(options);
  const now = options.now ? new Date(options.now) : new Date();
  const databaseUrl = resolveDatabaseUrl(options);
  const backupPath = options.apply ? prepareBackupPath(options.backup) : null;

  const deps = await loadDependencies();
  const clients = await createClients(deps, options.project, databaseUrl);
  const { firestore, realtime, readDocument } = clients;
  console.log(`\nSaboteur mission retention cleanup`);
  console.log(`mode: ${options.apply ? 'APPLY (back up, then delete)' : 'dry run'}`);
  console.log(`project: ${options.project}`);
  console.log(`databaseURL: ${databaseUrl} (namespace: ${realtimeNamespaceOf(databaseUrl)})`);
  console.log(`now: ${now.toISOString()}`);

  try {
    const missions = await deps.listExpiredMissions(firestore, now);
    console.log(`\nRetention policy selected ${missions.length} mission(s).`);
    if (missions.length === 0) {
      console.log('Nothing to do.');
      return 0;
    }
    if (!options.apply) {
      dryRunReport(missions, now);
      return 0;
    }

    console.log('\nCollecting backup (aborting on any error, before any delete)...');
    const artifact = await buildBackupArtifact({
      firestore,
      realtime,
      readDocument,
      missions,
      now,
      project: options.project,
      databaseUrl,
    });
    const bytes = writeBackupArtifact(backupPath, artifact);
    console.log(
      `\nBackup written: ${backupPath} (${bytes} bytes, mode 0600, ${artifact.missionCount} mission(s), ` +
        `${artifact.totalDocuments} Firestore document(s), ${artifact.totalRealtimePaths} realtime path(s))`,
    );

    return await applyDeletions({ deps, firestore, realtime, readDocument, missions, artifact, now });
  } finally {
    await clients.close();
  }
}

function describeError(err) {
  return err?.message ?? String(err);
}

main().then(
  (code) => {
    process.exitCode = code ?? 0;
  },
  (err) => {
    if (err instanceof UsageError) {
      console.error(`error: ${err.message}`);
      console.error('Run with --help for usage.');
      process.exitCode = 2;
    } else {
      console.error(`error: ${describeError(err)}`);
      process.exitCode = 1;
    }
  },
);
