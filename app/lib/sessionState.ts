import {
  GoalGroup,
  GoalStatus,
  GOAL_GROUPS,
  DAY_CONFIGS,
  STRATEGIC_MANDATORY_AFTER,
} from "../config";
import { storageGet, storageSet, STORAGE_KEYS, getCurrentDate } from "./storage";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SessionRecord {
  /** Incrementing counter, starting at 1 */
  session: number;
  /** YYYY-MM-DD – used to detect day changes and for display */
  date: string;
  dayOfWeek: number;
  statuses: Record<string, GoalStatus>;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

export function loadSessions(): SessionRecord[] {
  return storageGet<SessionRecord[]>(STORAGE_KEYS.SESSIONS, []);
}

export function saveSessions(sessions: SessionRecord[]): void {
  storageSet(STORAGE_KEYS.SESSIONS, sessions);
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function todayDateStr(): string {
  const d = getCurrentDate(); // respects debug offset
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Group helpers ────────────────────────────────────────────────────────────

/**
 * Returns the variant of a non-composite group that applies on a given day,
 * or null if no variant matches.
 */
export function getActiveVariant(
  group: GoalGroup,
  dayOfWeek: number
): GoalGroup["variants"][number] | null {
  for (const v of group.variants) {
    if (!v.activeDays || v.activeDays.includes(dayOfWeek)) return v;
  }
  return null;
}

/**
 * Returns all GOAL_GROUPS that have at least one active variant for the day.
 */
export function getActiveGroups(dayOfWeek: number): GoalGroup[] {
  return GOAL_GROUPS.filter((g) => {
    if (g.composite) {
      return g.variants.some((v) => !v.activeDays || v.activeDays.includes(dayOfWeek));
    }
    return getActiveVariant(g, dayOfWeek) !== null;
  });
}

/**
 * For composite groups: counts successes among active variants, capped at maxPoints.
 * For non-composite groups: 1 if the active variant is success, else 0.
 */
export function getGroupPoints(
  group: GoalGroup,
  statuses: Record<string, GoalStatus>,
  dayOfWeek: number
): number {
  const max = group.maxPoints ?? 1;
  if (group.composite) {
    const active = group.variants.filter(
      (v) => !v.activeDays || v.activeDays.includes(dayOfWeek)
    );
    const successes = active.filter((v) => statuses[v.id] === "success").length;
    return Math.min(max, successes);
  }
  const variant = getActiveVariant(group, dayOfWeek);
  return variant && statuses[variant.id] === "success" ? 1 : 0;
}

/**
 * Returns { achieved, max } points for a given day's statuses.
 */
export function getDayPoints(
  statuses: Record<string, GoalStatus>,
  dayOfWeek: number
): { achieved: number; max: number } {
  const active = getActiveGroups(dayOfWeek);
  const achieved = active.reduce(
    (sum, g) => sum + getGroupPoints(g, statuses, dayOfWeek),
    0
  );
  const max = active.reduce((sum, g) => sum + (g.maxPoints ?? 1), 0);
  return { achieved, max };
}

/**
 * Returns the savings impact (€) of a single session given the full history.
 * Needs the full array + index to determine mandatory groups at that point in time.
 *
 * Rules:
 *  +reward  when a variant with reward is completed successfully
 *  -4€      when a non-relax day scores 0 points despite being attempted
 *  -2€      for each mandatory strategic goal that is explicitly marked "fail"
 */
export function getSessionSavingsImpact(
  sessions: SessionRecord[],
  index: number
): number {
  const session = sessions[index];
  const dayConfig = DAY_CONFIGS[session.dayOfWeek];
  if (dayConfig.threshold === 0) return 0;

  const activeGroups = getActiveGroups(session.dayOfWeek);
  let impact = 0;
  let dayPoints = 0;
  let anyMarked = false;

  for (const group of activeGroups) {
    if (group.composite) {
      const active = group.variants.filter(
        (v) => !v.activeDays || v.activeDays.includes(session.dayOfWeek)
      );
      for (const variant of active) {
        const s = session.statuses[variant.id];
        if (s != null) anyMarked = true;
        if (s === "success" && variant.reward) impact += variant.reward;
      }
      dayPoints += getGroupPoints(group, session.statuses, session.dayOfWeek);
    } else {
      const variant = getActiveVariant(group, session.dayOfWeek);
      if (variant) {
        const s = session.statuses[variant.id];
        if (s != null) anyMarked = true;
        if (s === "success" && variant.reward) impact += variant.reward;
        if (s === "success") dayPoints++;
      }
    }
  }

  // -4€ penalty: attempted the day but scored 0 points
  if (anyMarked && dayPoints === 0) impact -= 4;

  // -2€ penalty: a mandatory strategic goal was explicitly failed
  const mandatoryIds = getMandatoryGroupIds(sessions, index, session.dayOfWeek);
  for (const groupId of mandatoryIds) {
    const group = GOAL_GROUPS.find((g) => g.id === groupId);
    if (!group) continue;

    const isFailed = group.composite
      ? group.variants.some(
          (v) =>
            (!v.activeDays || v.activeDays.includes(session.dayOfWeek)) &&
            session.statuses[v.id] === "fail"
        )
      : (() => {
          const variant = getActiveVariant(group, session.dayOfWeek);
          return variant ? session.statuses[variant.id] === "fail" : false;
        })();

    if (isFailed) impact -= 2;
  }

  return impact;
}

/**
 * Calculates the total savings (€) across all sessions.
 */
export function calculateSavings(sessions: SessionRecord[]): number {
  return sessions.reduce((sum, _, i) => sum + getSessionSavingsImpact(sessions, i), 0);
}

// ─── Streak / mandatory logic ─────────────────────────────────────────────────

/**
 * Returns how many consecutive past sessions a strategic group
 * was NOT marked as success. Sessions where the group had no active variant are skipped.
 */
export function getConsecutiveNonSuccess(
  sessions: SessionRecord[],
  beforeIndex: number,
  groupId: string
): number {
  const group = GOAL_GROUPS.find((g) => g.id === groupId);
  if (!group) return 0;

  let count = 0;
  for (let i = beforeIndex - 1; i >= 0; i--) {
    const s = sessions[i];
    const hasActivity = group.composite
      ? group.variants.some((v) => !v.activeDays || v.activeDays.includes(s.dayOfWeek))
      : getActiveVariant(group, s.dayOfWeek) !== null;

    if (!hasActivity) continue;
    if (getGroupPoints(group, s.statuses, s.dayOfWeek) > 0) break;
    count++;
  }
  return count;
}

/**
 * Returns the group ids that are mandatory today:
 * strategic groups whose consecutive non-success streak >= STRATEGIC_MANDATORY_AFTER.
 */
export function getMandatoryGroupIds(
  sessions: SessionRecord[],
  currentIndex: number,
  dayOfWeek: number
): string[] {
  return GOAL_GROUPS.filter(
    (g) =>
      g.type === "strategic" &&
      getActiveGroups(dayOfWeek).some((ag) => ag.id === g.id) &&
      getConsecutiveNonSuccess(sessions, currentIndex, g.id) >=
        STRATEGIC_MANDATORY_AFTER
  ).map((g) => g.id);
}

// ─── Session management ───────────────────────────────────────────────────────

/**
 * Gets today's session (by date) or creates a new one if the date changed.
 */
export function getOrCreateTodaySession(sessions: SessionRecord[]): {
  sessions: SessionRecord[];
  index: number;
} {
  const today = todayDateStr();
  const existing = sessions.findIndex((s) => s.date === today);
  if (existing !== -1) return { sessions, index: existing };

  const last = sessions[sessions.length - 1];
  const newSession: SessionRecord = {
    session: last ? last.session + 1 : 1,
    date: today,
    dayOfWeek: getCurrentDate().getDay(),
    statuses: {},
  };
  const updated = [...sessions, newSession];
  return { sessions: updated, index: updated.length - 1 };
}
