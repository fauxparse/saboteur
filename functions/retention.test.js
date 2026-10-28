// Pure-policy tests for isMissionExpired: fixed `now`, no Firestore/Realtime
// contact.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Timestamp } from "firebase-admin/firestore";
import { isMissionExpired } from "./retention.js";

const NOW = new Date("2026-10-28T03:00:00.000Z");
const CUTOFF_MS = NOW.getTime() - 30 * 24 * 60 * 60 * 1000;

const atCutoff = () => new Date(CUTOFF_MS);
const shifted = (date, ms) => new Date(date.getTime() + ms);
const ts = (date) => Timestamp.fromDate(date);
// Standard createTime for cases where only endsAt must matter.
const OLD_CREATE = ts(shifted(atCutoff(), -1));

describe("completed missions (endsAt set)", () => {
  it("expires when endsAt is strictly older than 30 days", () => {
    assert.equal(isMissionExpired({ endsAt: ts(shifted(atCutoff(), -1)) }, OLD_CREATE, NOW), true);
  });

  it("preserves at exactly the 30 day boundary (strict comparison)", () => {
    assert.equal(isMissionExpired({ endsAt: ts(atCutoff()) }, OLD_CREATE, NOW), false);
  });

  it("preserves when endsAt is more recent than 30 days", () => {
    assert.equal(isMissionExpired({ endsAt: ts(shifted(atCutoff(), 1)) }, OLD_CREATE, NOW), false);
  });

  it("preserves when endsAt is in the future", () => {
    assert.equal(
      isMissionExpired(
        { startsAt: shifted(NOW, -3600_000), endsAt: ts(shifted(NOW, 3600_000)) },
        OLD_CREATE,
        NOW
      ),
      false
    );
  });

  it("expires on endsAt alone when startsAt is null", () => {
    assert.equal(
      isMissionExpired({ startsAt: null, endsAt: ts(shifted(atCutoff(), -1)) }, OLD_CREATE, NOW),
      true
    );
  });
});

describe("draft missions (startsAt and endsAt null/missing)", () => {
  it("expires when createTime is strictly older than 30 days", () => {
    assert.equal(isMissionExpired({ startsAt: null, endsAt: null }, shifted(atCutoff(), -1), NOW), true);
    assert.equal(isMissionExpired({}, ts(shifted(atCutoff(), -1)), NOW), true);
  });

  it("preserves at exactly the 30 day createTime boundary", () => {
    assert.equal(isMissionExpired({}, ts(atCutoff()), NOW), false);
  });

  it("preserves when createTime is recent", () => {
    assert.equal(isMissionExpired({}, ts(shifted(atCutoff(), 1)), NOW), false);
  });

  it("preserves when createTime is missing for a draft", () => {
    assert.equal(isMissionExpired({}, undefined, NOW), false);
    assert.equal(isMissionExpired({}, null, NOW), false);
  });
});

describe("zero dates and missing metadata", () => {
  it("treats a zero (epoch) endsAt as a valid ancient completion", () => {
    assert.equal(isMissionExpired({ endsAt: ts(new Date(0)) }, OLD_CREATE, NOW), true);
  });

  it("treats a zero (epoch) createTime as a valid ancient draft", () => {
    assert.equal(isMissionExpired({}, Timestamp.fromMillis(0), NOW), true);
  });

  it("treats an empty document as a draft decided by createTime", () => {
    assert.equal(isMissionExpired({}, shifted(atCutoff(), -86_400_000), NOW), true);
  });

  it("accepts duck-typed Timestamp objects (toDate)", () => {
    assert.equal(
      isMissionExpired({ endsAt: { toDate: () => shifted(atCutoff(), -1) } }, OLD_CREATE, NOW),
      true
    );
  });
});

describe("running and future missions", () => {
  it("preserves a running mission: startsAt set, no endsAt, however old", () => {
    assert.equal(
      isMissionExpired(
        { startsAt: ts(shifted(NOW, -365 * 24 * 3600_000)), endsAt: null },
        OLD_CREATE,
        NOW
      ),
      false
    );
  });

  it("preserves a future scheduled mission with no end", () => {
    assert.equal(
      isMissionExpired({ startsAt: ts(shifted(NOW, 24 * 3600_000)), endsAt: null }, OLD_CREATE, NOW),
      false
    );
  });

  it("preserves a mission whose entire window is in the future", () => {
    assert.equal(
      isMissionExpired(
        { startsAt: ts(shifted(NOW, 24 * 3600_000)), endsAt: ts(shifted(NOW, 48 * 3600_000)) },
        OLD_CREATE,
        NOW
      ),
      false
    );
  });
});

describe("invalid fields are preserved, never deleted", () => {
  it("rejects malformed startsAt/endsAt types", () => {
    assert.equal(isMissionExpired({ startsAt: "2024-01-01" }, shifted(atCutoff(), -1), NOW), false);
    assert.equal(isMissionExpired({ endsAt: 12345 }, OLD_CREATE, NOW), false);
    assert.equal(isMissionExpired({ endsAt: true }, OLD_CREATE, NOW), false);
    assert.equal(isMissionExpired({ endsAt: ["2024-01-01"] }, OLD_CREATE, NOW), false);
    assert.equal(isMissionExpired({ endsAt: { seconds: 1, nanoseconds: 2 } }, OLD_CREATE, NOW), false);
  });

  it("rejects invalid Date instances", () => {
    assert.equal(isMissionExpired({ endsAt: new Date(NaN) }, OLD_CREATE, NOW), false);
    assert.equal(
      isMissionExpired({ startsAt: new Date(NaN), endsAt: ts(shifted(atCutoff(), -1)) }, OLD_CREATE, NOW),
      false
    );
  });

  it("rejects malformed data or createTime for drafts", () => {
    assert.equal(isMissionExpired(null, ts(shifted(atCutoff(), -1)), NOW), false);
    assert.equal(isMissionExpired(["mission"], ts(shifted(atCutoff(), -1)), NOW), false);
    assert.equal(isMissionExpired({}, new Date(NaN), NOW), false);
    assert.equal(isMissionExpired({}, "2020-01-01", NOW), false);
  });

  it("rejects an invalid `now`", () => {
    assert.equal(
      isMissionExpired({ endsAt: ts(shifted(atCutoff(), -1)) }, OLD_CREATE, new Date(NaN)),
      false
    );
  });
});
