"use client";
import { useEffect, useState } from "react";

export function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const fmt = (tz: string) =>
    now.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true });
  return (
    <span className="hidden xl:inline text-[11px] text-[#9aa0ab] tabular-nums">
      SEL {fmt("Asia/Seoul")} <span className="text-[#d0d4dc]">|</span> NYC {fmt("America/New_York")}
    </span>
  );
}
