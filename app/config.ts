// ─── Types ───────────────────────────────────────────────────────────────────

export type GoalType = "strategic" | "secondary";
export type DayType = "office" | "home" | "relax";
export type GoalStatus = "success" | "fail" | null;

/**
 * A variant is a concrete toggle item.
 * activeDays: days of week it appears (0=Sun…6=Sat). Undefined = every day.
 * reward: €amount added to the hucha when this variant is completed successfully.
 */
export interface GoalVariant {
  id: string;
  label: string;
  activeDays?: number[];
  reward?: number;
}

/**
 * A GoalGroup maps to one logical slot in the day (one point contribution).
 * composite: if true, ALL matching variants are shown simultaneously and their
 *   successes are capped at maxPoints (used for "Hábitos").
 * maxPoints: max point contribution of the group (default 1).
 */
export interface GoalGroup {
  id: string;
  type: GoalType;
  variants: GoalVariant[];
  composite?: boolean;
  maxPoints?: number;
}

export interface DayConfig {
  /** Minimum group points needed to count the day as successful */
  threshold: number;
  type: DayType;
}

// ─── Day configuration ────────────────────────────────────────────────────────
// Days: 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat

export const DAY_CONFIGS: Record<number, DayConfig> = {
  0: { threshold: 0, type: "relax" },   // Sunday
  1: { threshold: 2, type: "home" },    // Monday
  2: { threshold: 2, type: "office" },  // Tuesday
  3: { threshold: 2, type: "home" },    // Wednesday
  4: { threshold: 2, type: "office" },  // Thursday
  5: { threshold: 1, type: "home" },    // Friday
  6: { threshold: 0, type: "relax" },   // Saturday
};

/**
 * A strategic goal becomes mandatory after this many consecutive
 * sessions where it was not marked as success.
 */
export const STRATEGIC_MANDATORY_AFTER = 2;

// ─── Goals ───────────────────────────────────────────────────────────────────
// All goals are Mon–Fri only (activeDays: [1,2,3,4,5])

export const GOAL_GROUPS: GoalGroup[] = [
  {
    id: "sleep",
    type: "strategic",
    variants: [
      { id: "sleep", label: "Dormir temprano", activeDays: [1, 2, 3, 4, 5] },
    ],
  },
  {
    id: "tech",
    type: "strategic",
    variants: [
      { id: "tech", label: "Tech", activeDays: [1, 2, 3, 4, 5] },
    ],
  },
  {
    id: "exercise",
    type: "strategic",
    variants: [
      { id: "exercise-gym", label: "Gym", activeDays: [1, 3, 5] },
      { id: "exercise-ofi", label: "Andar a la ofi", activeDays: [2, 4], reward: 4 },
    ],
  },
  {
    // Two independent toggles that together count as a max of 1 point
    id: "habits",
    type: "secondary",
    composite: true,
    maxPoints: 1,
    variants: [
      { id: "habits-read", label: "Leer", activeDays: [1, 2, 3, 4, 5] },
      { id: "habits-chores", label: "Tareas de casa", activeDays: [1, 2, 3, 4, 5] },
    ],
  },
];
