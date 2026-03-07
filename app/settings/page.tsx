"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import {
  loadChallengeConfig,
  saveChallengeConfig,
  ChallengeConfig,
  DEFAULT_CHALLENGE_CONFIG,
} from "../lib/storage";

function daysBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const diff =
    new Date(end + "T12:00:00").getTime() -
    new Date(start + "T12:00:00").getTime();
  return Math.max(0, Math.round(diff / 86_400_000) + 1);
}

export default function SettingsPage() {
  const [config, setConfig] = useState<ChallengeConfig>(DEFAULT_CHALLENGE_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConfig(loadChallengeConfig());
  }, []);

  const handleSave = () => {
    saveChallengeConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const days = daysBetween(config.startDate, config.endDate);
  const isValid = config.startDate && config.endDate && config.startDate <= config.endDate;

  return (
    <div className="min-h-screen bg-violet-50 pt-14 pb-16 px-4">
      <div className="max-w-sm mx-auto py-6 flex flex-col gap-4">

        {/* Reto duration */}
        <div className="bg-white rounded-3xl border-2 border-violet-100 p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">
            Duración del reto
          </h3>

          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-500">Día de inicio</span>
              <input
                type="date"
                value={config.startDate}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:border-violet-300 focus:bg-white transition-colors"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-500">Día de fin</span>
              <input
                type="date"
                value={config.endDate}
                min={config.startDate}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:border-violet-300 focus:bg-white transition-colors"
              />
            </label>

            {/* Day count */}
            <div className="h-5 flex items-center justify-center">
              {isValid && days > 0 ? (
                <p className="text-xs text-slate-400">
                  {days} {days === 1 ? "día" : "días"} de reto
                </p>
              ) : !isValid && config.startDate && config.endDate ? (
                <p className="text-xs text-rose-400">
                  La fecha de fin debe ser posterior al inicio
                </p>
              ) : null}
            </div>

            <button
              onClick={handleSave}
              disabled={!isValid}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${
                saved
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-violet-100 text-violet-700 hover:bg-violet-200"
              }`}
            >
              {saved && <Check size={15} />}
              {saved ? "Guardado" : "Guardar cambios"}
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center px-4">
          Los días fuera del rango quedan almacenados y se recuperan si
          vuelven a estar dentro del reto.
        </p>
      </div>
    </div>
  );
}
