"use client";

import { CheckCircle2, XCircle, Circle, Flame } from "lucide-react";
import { GoalStatus, GoalType } from "../config";

interface GoalToggleProps {
  label: string;
  status: GoalStatus;
  type: GoalType;
  /** True when a strategic goal has been non-success for 2+ days in a row */
  mandatory: boolean;
  onClick: () => void;
}

const GoalToggle = ({ label, status, type, mandatory, onClick }: GoalToggleProps) => {
  const baseStyles =
    status === "success"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : status === "fail"
      ? "bg-rose-100 text-rose-600 border-rose-200"
      : mandatory
      ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
      : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100";

  const icon =
    status === "success" ? (
      <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
    ) : status === "fail" ? (
      <XCircle size={20} className="text-rose-400 shrink-0" />
    ) : (
      <Circle size={20} className={`shrink-0 ${mandatory ? "text-amber-400" : "text-slate-300"}`} />
    );

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all duration-200 active:scale-95 ${baseStyles}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* Strategic indicator */}
        {type === "strategic" && (
          <Flame
            size={13}
            className={`shrink-0 ${
              status === "success"
                ? "text-emerald-500"
                : mandatory
                ? "text-amber-500"
                : "text-slate-300"
            }`}
          />
        )}
        <span className="text-sm font-medium truncate">{label}</span>
        {mandatory && status !== "success" && (
          <span className="text-[9px] font-bold uppercase tracking-wide bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full shrink-0">
            hoy sí
          </span>
        )}
      </div>
      {icon}
    </button>
  );
};

export default GoalToggle;
