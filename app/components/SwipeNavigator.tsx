"use client";

import { useRouter, usePathname } from "next/navigation";
import { useRef } from "react";

const routes = ["/", "/calendar", "/stats"];
const MIN_SWIPE_X = 60;
const MAX_SWIPE_Y = 80;

export default function SwipeNavigator({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;

    // Ignorar si el movimiento es más vertical que horizontal
    if (Math.abs(dy) > MAX_SWIPE_Y || Math.abs(dx) < MIN_SWIPE_X) return;

    const currentIndex = routes.indexOf(pathname);
    if (currentIndex === -1) return;

    if (dx < 0 && currentIndex < routes.length - 1) {
      // Swipe izquierda → vista siguiente
      router.push(routes[currentIndex + 1]);
    } else if (dx > 0 && currentIndex > 0) {
      // Swipe derecha → vista anterior
      router.push(routes[currentIndex - 1]);
    }
  };

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {children}
    </div>
  );
}
