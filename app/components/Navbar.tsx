"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, BarChart2 } from "lucide-react";

const navItems = [
  { label: "Inicio", icon: Home, href: "/" },
  { label: "Calendario", icon: CalendarDays, href: "/calendar" },
  { label: "Estadísticas", icon: BarChart2, href: "/stats" },
];

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white/80 backdrop-blur-md border-t border-violet-100">
      <div className="max-w-md mx-auto h-full flex items-center justify-around px-6">
        {navItems.map(({ label, icon: Icon, href }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive ? "text-violet-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-semibold tracking-wide">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
