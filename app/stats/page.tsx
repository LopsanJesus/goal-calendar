"use client";

import { useEffect, useState } from "react";
import { Banknote, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import {
  loadSessions,
  calculateSavings,
  getSessionSavingsImpact,
  getDayPoints,
  SessionRecord,
} from "../lib/sessionState";
import { loadChallengeConfig, ChallengeConfig, DEFAULT_CHALLENGE_CONFIG } from "../lib/storage";
import { DAY_CONFIGS } from "../config";

export default function StatsPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [config, setConfig] = useState<ChallengeConfig>(DEFAULT_CHALLENGE_CONFIG);

  useEffect(() => {
    const s = loadSessions();
    setSessions(s);
    setConfig(loadChallengeConfig());
  }, []);

  const inRange = sessions.filter(
    (s) => s.date >= config.startDate && s.date <= config.endDate
  );

  const savings = calculateSavings(sessions);

  // Per-session savings breakdown
  let earnedTotal = 0;
  let penaltyTotal = 0;
  let rewardDays = 0;
  let penaltyDays = 0;

  sessions.forEach((_, i) => {
    const impact = getSessionSavingsImpact(sessions, i);
    if (impact > 0) { earnedTotal += impact; rewardDays++; }
    if (impact < 0) { penaltyTotal += impact; penaltyDays++; }
  });

  // Win/fail breakdown within challenge range
  let goodDays = 0;
  let failDays = 0;
  let emptyDays = 0;

  for (const s of inRange) {
    const dayConfig = DAY_CONFIGS[s.dayOfWeek];
    if (dayConfig.threshold === 0) continue;
    const { achieved } = getDayPoints(s.statuses, s.dayOfWeek);
    const anyMarked = Object.values(s.statuses).some((v) => v !== null);
    if (!anyMarked) { emptyDays++; continue; }
    if (achieved >= dayConfig.threshold) goodDays++;
    else failDays++;
  }

  return (
    <div className="min-h-screen bg-violet-50 pt-14 pb-16 px-4">
      <div className="max-w-sm mx-auto py-6 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-slate-800">Estadísticas</h2>

        {/* Savings total */}
        <div
          className={`rounded-3xl border-2 p-6 shadow-sm ${
            savings >= 0
              ? "bg-emerald-50 border-emerald-200"
              : "bg-rose-50 border-rose-200"
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            Hucha
          </p>
          <div className="flex items-end gap-2">
            <Banknote
              size={28}
              className={savings >= 0 ? "text-emerald-500" : "text-rose-400"}
            />
            <span
              className={`text-4xl font-black tabular-nums ${
                savings >= 0 ? "text-emerald-700" : "text-rose-600"
              }`}
            >
              {savings >= 0 ? "+" : ""}{savings}€
            </span>
          </div>

          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={14} className="text-emerald-500" />
              <span className="text-xs text-slate-500">
                +{earnedTotal}€ ({rewardDays} {rewardDays === 1 ? "día" : "días"})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingDown size={14} className="text-rose-400" />
              <span className="text-xs text-slate-500">
                {penaltyTotal}€ ({penaltyDays} {penaltyDays === 1 ? "día" : "días"})
              </span>
            </div>
          </div>
        </div>

        {/* Days summary */}
        <div className="bg-white rounded-3xl border-2 border-violet-100 p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
            Días del reto
          </p>

          <div className="flex gap-3">
            <div className="flex-1 bg-emerald-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-emerald-700">{goodDays}</p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                Buenos
              </p>
            </div>
            <div className="flex-1 bg-rose-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-rose-600">{failDays}</p>
              <p className="text-[10px] text-rose-500 font-semibold mt-0.5">
                Fallidos
              </p>
            </div>
            <div className="flex-1 bg-slate-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-slate-400">{emptyDays}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                Sin datos
              </p>
            </div>
          </div>

          {inRange.length > 0 && goodDays + failDays > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <Calendar size={13} className="text-slate-400" />
              <span className="text-xs text-slate-400">
                {Math.round((goodDays / (goodDays + failDays)) * 100)}% de éxito en días activos
              </span>
            </div>
          )}
        </div>

        {sessions.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">
            Aún no hay datos registrados.
          </p>
        )}
      </div>
    </div>
  );
}
