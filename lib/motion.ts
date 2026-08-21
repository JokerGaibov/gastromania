export const easeStandard = [0.25, 0.46, 0.45, 0.94] as const;
export const easeSpring = [0.16, 1, 0.3, 1] as const;

const HEADER_CLEARANCE = 96;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function triggerArrivalGlow(el: HTMLElement) {
  el.classList.remove("arrival-glow");
  // Force reflow so the animation restarts if triggered again before it finished.
  void el.offsetWidth;
  el.classList.add("arrival-glow");
  el.addEventListener("animationend", () => el.classList.remove("arrival-glow"), { once: true });
}

/**
 * Cinematic scroll-to-section: eased tween instead of the browser's flat
 * `scrollIntoView({behavior:"smooth"})`, plus a brief bronze glow on arrival
 * so navigating to a section reads as a deliberate "landing" rather than a
 * plain jump. Hand-rolled rAF loop (not CSS scroll-behavior, not a library
 * tween) so there's exactly one thing driving window.scrollTo per frame.
 */
export function smoothScrollTo(target: string | HTMLElement, offset = HEADER_CLEARANCE) {
  const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (!el) return;

  const startY = window.scrollY;
  const destination = Math.max(0, el.getBoundingClientRect().top + startY - offset);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion) {
    window.scrollTo({ top: destination, behavior: "auto" });
    triggerArrivalGlow(el);
    return;
  }

  const distance = destination - startY;
  const durationMs = Math.min(1400, Math.max(700, Math.abs(distance) / 1.4));
  let start: number | null = null;

  function frame(now: number) {
    if (start === null) start = now;
    const t = Math.min(1, (now - start) / durationMs);
    window.scrollTo({ top: startY + distance * easeOutCubic(t), behavior: "auto" });
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      triggerArrivalGlow(el as HTMLElement);
    }
  }
  requestAnimationFrame(frame);
}
