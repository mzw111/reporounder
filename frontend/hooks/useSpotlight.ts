import { useEffect } from 'react';

export function useSpotlight() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const spotlight = document.getElementById('cursor-spotlight');

    const onMove = (e: PointerEvent) => {
      if (spotlight) {
        spotlight.style.setProperty('--cursor-x', `${e.clientX}px`);
        spotlight.style.setProperty('--cursor-y', `${e.clientY}px`);
      }

      // Per-card illumination
      const cards = document.querySelectorAll<HTMLElement>('.spotlight-card');
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--card-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--card-y', `${e.clientY - rect.top}px`);
      });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
}
