"use client";

import { useEffect, useState } from "react";

type MaintenanceCountdownProps = {
  endDate: string;
};

type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  expired: boolean;
};

function computeCountdown(endDate: string): CountdownParts {
  const diff = new Date(endDate).getTime() - Date.now();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  return { days, hours, minutes, expired: false };
}

export default function MaintenanceCountdown({ endDate }: MaintenanceCountdownProps) {
  const [parts, setParts] = useState<CountdownParts>(() => computeCountdown(endDate));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setParts(computeCountdown(endDate));
    }, 30_000);

    return () => window.clearInterval(timer);
  }, [endDate]);

  if (parts.expired) {
    return (
      <p className="text-sm text-aw-muted" role="status">
        Die Wiedereröffnung steht unmittelbar bevor.
      </p>
    );
  }

  return (
    <div
      className="mt-8 rounded-2xl border border-aw-gold/30 bg-aw-surface/80 p-6 text-center"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm uppercase tracking-[0.2em] text-aw-gold">Noch</p>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <p className="font-display text-3xl font-bold text-aw-cream">{parts.days}</p>
          <p className="text-xs text-aw-muted">Tage</p>
        </div>
        <div>
          <p className="font-display text-3xl font-bold text-aw-cream">{parts.hours}</p>
          <p className="text-xs text-aw-muted">Stunden</p>
        </div>
        <div>
          <p className="font-display text-3xl font-bold text-aw-cream">{parts.minutes}</p>
          <p className="text-xs text-aw-muted">Minuten</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-aw-muted">bis zur Wiedereröffnung</p>
    </div>
  );
}
