import { useEffect, useState } from "react";
import { TIMER_REFRESH_INTERVAL_MS } from "../../../shared/constants";

export function useRoundTimer(roundEndsAt?: number) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!roundEndsAt) return;
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, TIMER_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [roundEndsAt]);

  return roundEndsAt ? Math.max(0, Math.ceil((roundEndsAt - now) / 1000)) : 0;
}
