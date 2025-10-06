'use client';
import { useEffect, useState } from 'react';

const TARGET = new Date('2026-04-25T00:00:00-06:00'); // April 25, 2026 MDT

export default function Countdown() {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, TARGET.getTime() - Date.now());
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTime({ d, h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');

  const Item = ({ value, label }) => (
    <div className="text-center">
      <div className="text-5xl md:text-6xl font-serif text-[#6b5a4e]">{value}</div>
      <div className="mt-1 text-[10px] md:text-xs tracking-[0.35em] uppercase text-[#b7a9a0]">{label}</div>
    </div>
  );

  return (
    <section className="bg-[#dfd8c1]">
      <div className="max-w-4xl mx-auto px-6 py-10 md:py-14">
        <div className="grid grid-cols-4 gap-8 md:gap-14 justify-items-center">
          <Item value={time.d} label="Days" />
          <Item value={pad(time.h)} label="Hours" />
          <Item value={pad(time.m)} label="Minutes" />
          <Item value={pad(time.s)} label="Seconds" />
        </div>
      </div>
    </section>
  );
}
