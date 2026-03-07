"use client";

import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";

const TopBar = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/80 backdrop-blur-md border-b border-violet-100">
      <div className="max-w-sm mx-auto h-full flex items-center justify-between px-4">
        <div className="w-8" />
        <h1 className="text-base font-bold tracking-tight text-violet-800">
          #ElReto
        </h1>
        <Link
          href="/settings"
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
          aria-label="Configuración"
        >
          <SlidersHorizontal size={18} />
        </Link>
      </div>
    </header>
  );
};

export default TopBar;
