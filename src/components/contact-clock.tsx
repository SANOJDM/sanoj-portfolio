"use client";

import { useEffect, useState } from "react";

const formatter = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function formatChennai(date: Date) {
  const parts = formatter.formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "";
  const period = parts.find((part) => part.type === "dayPeriod")?.value ?? "";
  const suffix =
    period.toUpperCase() === "AM"
      ? "a.m."
      : period.toUpperCase() === "PM"
        ? "p.m."
        : period;
  return `${hour}:${minute} ${suffix}`;
}

export function ContactClock({ stacked = false }: { stacked?: boolean }) {
  const [time, setTime] = useState("--:--");

  useEffect(() => {
    const tick = () => setTime(formatChennai(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className={`contact-clock${stacked ? " contact-clock--stacked" : ""}`}>
      <div className="contact-clock__group">
        <p className="label">Wanna Say Hello?</p>
        <a
          href="mailto:vamsisanoj04@gmail.com"
          className="contact-clock__email"
        >
          vamsisanoj04@gmail.com
        </a>
      </div>
      <div className="contact-clock__group contact-clock__group--time">
        <p className="label">Local Time</p>
        <p className="contact-clock__time">
          Chennai <span suppressHydrationWarning>{time}</span>
        </p>
      </div>
    </div>
  );
}
