"use client";

import { useState, useEffect } from "react";
import { Briefcase, Home, Sunset, Banknote } from "lucide-react";
import GoalToggle from "./GoalToggle";
import { GOAL_GROUPS, DAY_CONFIGS, GoalStatus, DayType } from "../config";
import {
  SessionRecord,
  loadSessions,
  saveSessions,
  getOrCreateTodaySession,
  getActiveVariant,
  getActiveGroups,
  getGroupPoints,
  getDayPoints,
  getMandatoryGroupIds,
  getSessionSavingsImpact,
} from "../lib/sessionState";
import { getCurrentDate } from "../lib/storage";

// ─── Formatting ───────────────────────────────────────────────────────────────

const DAY_ABBR = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sab"];
const MONTH_ABBR = [
  "En",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

function formatDate(date: Date): string {
  return `${DAY_ABBR[date.getDay()]} ${date.getDate()} ${MONTH_ABBR[date.getMonth()]}`;
}

/**
 * Returns a label based on points achieved and whether the day threshold was met.
 * Fail track:    0 → "Fallo total"  |  1+ but below threshold → "Fallo"
 * Success track: barely met        → "Check"  |  3 pts → "Éxito"  |  max → "¡Perfecto!"
 */
export function getDayLabel(achieved: number, isGoodDay: boolean): string {
  if (!isGoodDay) return achieved === 0 ? "Fallo total" : "Fallo";
  if (achieved >= 4) return "¡Perfecto!";
  if (achieved >= 3) return "Éxito";
  return "Check";
}

const DAY_TYPE_ICONS: Record<DayType, React.ReactNode> = {
  office: <Briefcase size={72} strokeWidth={1} />,
  home: <Home size={72} strokeWidth={1} />,
  relax: <Sunset size={72} strokeWidth={1} />,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActiveDay() {
  const today = getCurrentDate();
  const dayOfWeek = today.getDay();
  const dayConfig = DAY_CONFIGS[dayOfWeek];
  const isRelax = dayConfig.threshold === 0;

  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [sessionIndex, setSessionIndex] = useState(-1);
  const [statuses, setStatuses] = useState<Record<string, GoalStatus>>({});

  useEffect(() => {
    const loaded = loadSessions();
    const { sessions: updated, index } = getOrCreateTodaySession(loaded);
    saveSessions(updated);
    setSessions(updated);
    setSessionIndex(index);
    setStatuses(updated[index].statuses);
  }, []);

  const toggle = (variantId: string) => {
    const current = statuses[variantId] ?? null;
    const next: GoalStatus =
      current === null ? "success" : current === "success" ? "fail" : null;

    const updatedStatuses = { ...statuses, [variantId]: next };
    const updatedSessions = sessions.map((s, i) =>
      i === sessionIndex ? { ...s, statuses: updatedStatuses } : s,
    );

    setStatuses(updatedStatuses);
    setSessions(updatedSessions);
    saveSessions(updatedSessions);
  };

  // ── Derived state ──────────────────────────────────────────────────────────
  const activeGroups = getActiveGroups(dayOfWeek);

  const mandatoryGroupIds =
    sessionIndex >= 0
      ? getMandatoryGroupIds(sessions, sessionIndex, dayOfWeek)
      : [];

  const { achieved: successCount, max: maxPoints } = getDayPoints(
    statuses,
    dayOfWeek,
  );

  const hasFail = Object.values(statuses).some((s) => s === "fail");
  const anyMarked = Object.values(statuses).some((s) => s !== null);

  const allMandatoryMet = mandatoryGroupIds.every((id) => {
    const g = GOAL_GROUPS.find((g) => g.id === id);
    return g ? getGroupPoints(g, statuses, dayOfWeek) > 0 : true;
  });

  const isGoodDay =
    isRelax || (successCount >= dayConfig.threshold && allMandatoryMet);

  const outcome: "success" | "fail" | null = isRelax
    ? null
    : !anyMarked
      ? null
      : isGoodDay
        ? "success"
        : hasFail
          ? "fail"
          : null;

  const savings = sessionIndex >= 0 ? getSessionSavingsImpact(sessions, sessionIndex) : 0;

  // ── Visual state ───────────────────────────────────────────────────────────
  const pageBg = isRelax
    ? "bg-amber-50"
    : isGoodDay && anyMarked
      ? "bg-emerald-50"
      : "bg-violet-50";

  const cardBorder = isRelax
    ? "border-amber-200"
    : isGoodDay && anyMarked
      ? "border-emerald-200"
      : "border-violet-100";

  const currentSession = sessions[sessionIndex];

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${pageBg} flex flex-col items-center justify-center px-4 pt-14 pb-16`}
    >
      <div
        className={`w-full max-w-sm bg-white rounded-3xl border-2 p-6 shadow-sm transition-all duration-500 relative overflow-hidden ${cardBorder}`}
      >
        {/* Day type background icon */}
        <div className="absolute top-4 right-4 opacity-[0.06] text-slate-800 pointer-events-none">
          {DAY_TYPE_ICONS[dayConfig.type]}
        </div>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-5 relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-800">
                {formatDate(today)}
              </h2>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-0.5">
                {isRelax
                  ? "Día libre"
                  : `${dayConfig.threshold} pt${dayConfig.threshold > 1 ? "s" : ""} para buen día`}
              </p>
            </div>

            {/* Savings badge */}
            {savings !== 0 && (
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                  savings >= 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-600"
                }`}
              >
                <Banknote size={12} />
                <span>
                  {savings >= 0 ? "+" : ""}
                  {savings}€
                </span>
              </div>
            )}
          </div>

          {/* Mandatory streak warning */}
          {mandatoryGroupIds.length > 0 && (
            <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              racha en riesgo
            </span>
          )}

          {currentSession && (
            <p className="text-[10px] text-slate-300 mt-1">
              Día #{currentSession.session}
            </p>
          )}
        </div>

        {/* ── Goal toggles ────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 relative z-10">
          {activeGroups.map((group) => {
            if (group.composite) {
              const activeVariants = group.variants.filter(
                (v) => !v.activeDays || v.activeDays.includes(dayOfWeek),
              );
              const pts = getGroupPoints(group, statuses, dayOfWeek);
              const max = group.maxPoints ?? 1;
              return (
                <div key={group.id}>
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    <span className="text-xs text-slate-400 font-medium">
                      Hábitos
                    </span>
                    <span className="text-[10px] text-slate-300">
                      {pts}/{max} pt
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {activeVariants.map((variant) => (
                      <GoalToggle
                        key={variant.id}
                        label={variant.label}
                        status={statuses[variant.id] ?? null}
                        type={group.type}
                        mandatory={false}
                        onClick={() => toggle(variant.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            }

            const variant = getActiveVariant(group, dayOfWeek)!;
            return (
              <GoalToggle
                key={group.id}
                label={variant.label}
                status={statuses[variant.id] ?? null}
                type={group.type}
                mandatory={mandatoryGroupIds.includes(group.id)}
                onClick={() => toggle(variant.id)}
              />
            );
          })}
        </div>

        {/* ── Day result + points ─────────────────────────────────────────── */}
        <div className="mt-5 relative z-10">
          {/* Points counter — always visible on non-relax days */}
          {!isRelax && (
            <div className="flex items-center justify-center mb-2">
              <span className="text-xs font-semibold text-slate-400">
                {successCount}
                <span className="text-slate-300">/{maxPoints} pts</span>
              </span>
            </div>
          )}

          {/* Result banner — space always reserved */}
          <div className="h-11 flex items-center justify-center">
            <div
              className={`w-full flex items-center justify-center px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                isRelax
                  ? "bg-amber-100 text-amber-700"
                  : outcome === "success"
                    ? "bg-emerald-100 text-emerald-700"
                    : outcome === "fail"
                      ? "bg-rose-100 text-rose-600"
                      : "invisible"
              }`}
            >
              {isRelax
                ? "Día libre"
                : outcome !== null
                  ? getDayLabel(successCount, isGoodDay)
                  : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
