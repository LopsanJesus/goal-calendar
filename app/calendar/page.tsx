"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Circle,
  Flame,
  Banknote,
  Briefcase,
  Home,
  Sunset,
} from "lucide-react";
import {
  loadSessions,
  getActiveVariant,
  getActiveGroups,
  getDayPoints,
  getSessionSavingsImpact,
  todayDateStr,
  SessionRecord,
} from "../lib/sessionState";
import {
  loadChallengeConfig,
  ChallengeConfig,
  DEFAULT_CHALLENGE_CONFIG,
} from "../lib/storage";
import { GOAL_GROUPS, DAY_CONFIGS, GoalStatus, DayType } from "../config";
import { getDayLabel } from "../components/ActiveDay";

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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return `${DAY_ABBR[d.getDay()]} ${d.getDate()} ${MONTH_ABBR[d.getMonth()]}`;
}

function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + "T12:00:00");
  const end = new Date(endDate + "T12:00:00");
  while (current <= end) {
    dates.push(
      `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`,
    );
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

type Outcome = "success" | "fail" | "relax" | "empty";

function getSessionOutcome(session: SessionRecord): Outcome {
  const dayConfig = DAY_CONFIGS[session.dayOfWeek];
  if (dayConfig.threshold === 0) return "relax";
  const { achieved } = getDayPoints(session.statuses, session.dayOfWeek);
  const anyMarked = Object.values(session.statuses).some((s) => s !== null);
  if (!anyMarked) return "empty";
  return achieved >= dayConfig.threshold ? "success" : "fail";
}

const outcomeClasses: Record<Outcome, string> = {
  success: "bg-emerald-100 text-emerald-700",
  fail: "bg-rose-100 text-rose-600",
  relax: "bg-amber-100 text-amber-700",
  empty: "bg-slate-100 text-slate-400",
};

function getOutcomeLabel(outcome: Outcome, achieved: number): string {
  if (outcome === "relax") return "Libre";
  if (outcome === "empty") return "Sin datos";
  return getDayLabel(achieved, outcome === "success");
}

const statusIcon = (status: GoalStatus) =>
  status === "success" ? (
    <CheckCircle2 size={14} className="text-emerald-500" />
  ) : status === "fail" ? (
    <XCircle size={14} className="text-rose-400" />
  ) : (
    <Circle size={14} className="text-slate-300" />
  );

const DAY_TYPE_ICON: Record<DayType, React.ReactNode> = {
  office: <Briefcase size={13} className="text-slate-400" />,
  home: <Home size={13} className="text-slate-400" />,
  relax: <Sunset size={13} className="text-amber-400" />,
};

export default function CalendarPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [config, setConfig] = useState<ChallengeConfig>(
    DEFAULT_CHALLENGE_CONFIG,
  );
  const [today, setToday] = useState("");

  useEffect(() => {
    setSessions(loadSessions());
    setConfig(loadChallengeConfig());
    setToday(todayDateStr());
  }, []);

  const outsideCount = sessions.filter(
    (s) => s.date < config.startDate || s.date > config.endDate,
  ).length;

  const sessionMap = new Map(sessions.map((s) => [s.date, s]));

  // All dates in range, newest first
  const allDates = generateDateRange(config.startDate, config.endDate);

  return (
    <div className="min-h-screen bg-violet-50 pt-14 pb-16 px-4">
      <div className="max-w-sm mx-auto py-6">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">Historial</h2>
          <span className="text-xs text-slate-400">
            {formatDate(config.startDate)} → {formatDate(config.endDate)}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {allDates.map((dateStr) => {
            const d = new Date(dateStr + "T12:00:00");
            const dayOfWeek = d.getDay();
            const dayConfig = DAY_CONFIGS[dayOfWeek];
            const isFuture = today && dateStr > today;
            const isToday = dateStr === today;
            const session = sessionMap.get(dateStr);

            // Future days — preview card
            if (isFuture) {
              const activeGroups = getActiveGroups(dayOfWeek);
              return (
                <div
                  key={dateStr}
                  className="bg-white/60 rounded-2xl border border-dashed border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-400">
                        {formatDate(dateStr)}
                      </span>
                      {DAY_TYPE_ICON[dayConfig.type]}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-slate-100 text-slate-400">
                      {dayConfig.threshold === 0 ? "Libre" : "Próximo"}
                    </span>
                  </div>
                  {dayConfig.threshold > 0 && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                      {activeGroups.map((group) => {
                        const label = group.composite
                          ? group.variants
                              .filter(
                                (v) =>
                                  !v.activeDays ||
                                  v.activeDays.includes(dayOfWeek),
                              )
                              .map((v) => v.label)
                              .join(", ")
                          : (getActiveVariant(group, dayOfWeek)?.label ?? "");
                        return (
                          <span
                            key={group.id}
                            className="text-[11px] text-slate-300"
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Past or today — recorded session or empty
            const outcome: Outcome = session
              ? getSessionOutcome(session)
              : dayConfig.threshold === 0
                ? "relax"
                : "empty";

            const { achieved, max } = session
              ? getDayPoints(session.statuses, dayOfWeek)
              : { achieved: 0, max: 0 };

            const fullIdx = session
              ? sessions.findIndex((s) => s.session === session.session)
              : -1;
            const savingsImpact =
              fullIdx >= 0 ? getSessionSavingsImpact(sessions, fullIdx) : 0;

            const activeGroups = getActiveGroups(dayOfWeek);

            return (
              <div
                key={dateStr}
                className={`bg-white rounded-2xl border p-4 shadow-sm ${
                  isToday ? "border-violet-200" : "border-slate-100"
                }`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-800">
                      {formatDate(dateStr)}
                    </span>
                    {DAY_TYPE_ICON[dayConfig.type]}
                    {isToday && (
                      <span className="text-[9px] font-bold uppercase tracking-wide text-violet-400">
                        hoy
                      </span>
                    )}
                    {session && (
                      <span className="text-[10px] text-slate-300">
                        #{session.session}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Points badge */}
                    {session && outcome !== "relax" && outcome !== "empty" && (
                      <span className="text-[10px] font-semibold text-slate-400 tabular-nums">
                        {achieved}/{max}pt
                      </span>
                    )}

                    {/* Savings impact badge */}
                    {savingsImpact !== 0 && (
                      <span
                        className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          savingsImpact > 0
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-600"
                        }`}
                      >
                        <Banknote size={10} />
                        {savingsImpact > 0 ? "+" : ""}
                        {savingsImpact}€
                      </span>
                    )}

                    {/* Outcome pill */}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${outcomeClasses[outcome]}`}
                    >
                      {getOutcomeLabel(outcome, achieved)}
                    </span>
                  </div>
                </div>

                {/* Goals */}
                {outcome !== "relax" && session && (
                  <div className="flex flex-col gap-1.5">
                    {activeGroups.map((group) => {
                      if (group.composite) {
                        const activeVariants = group.variants.filter(
                          (v) =>
                            !v.activeDays || v.activeDays.includes(dayOfWeek),
                        );
                        return activeVariants.map((variant) => {
                          const status = session.statuses[variant.id] ?? null;
                          return (
                            <div
                              key={variant.id}
                              className="flex items-center gap-2 text-sm text-slate-600"
                            >
                              {statusIcon(status)}
                              <span
                                className={
                                  status === null ? "text-slate-300" : ""
                                }
                              >
                                {variant.label}
                              </span>
                            </div>
                          );
                        });
                      }

                      const variant = getActiveVariant(group, dayOfWeek)!;
                      const status = session.statuses[variant.id] ?? null;
                      return (
                        <div
                          key={group.id}
                          className="flex items-center gap-2 text-sm text-slate-600"
                        >
                          {statusIcon(status)}
                          {group.type === "strategic" && (
                            <Flame
                              size={11}
                              className="text-slate-300 shrink-0"
                            />
                          )}
                          <span
                            className={status === null ? "text-slate-300" : ""}
                          >
                            {variant.label}
                          </span>
                          {variant.reward && status === "success" && (
                            <span className="text-[9px] text-emerald-600 font-bold">
                              +{variant.reward}€
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {outsideCount > 0 && (
          <p className="text-xs text-slate-400 text-center mt-4">
            {outsideCount} {outsideCount === 1 ? "día fuera" : "días fuera"} del
            rango — guardados, no perdidos.
          </p>
        )}
      </div>
    </div>
  );
}
