"use client";

import { useEffect } from "react";

/**
 * ScrollReveal — watches all [data-reveal] elements and adds .revealed
 * when they enter the viewport (12% threshold, 30px bottom margin).
 *
 * Falls back to immediately revealing everything when IntersectionObserver
 * is not available (old browsers / no-JS environments).
 *
 * Rendered once in the root layout so it covers all public pages.
 */
export function ScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");

    if (!("IntersectionObserver" in window)) {
      // Graceful fallback — reveal immediately
      els.forEach((el) => el.classList.add("revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" },
    );

    els.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Renders nothing — pure side-effect component
  return null;
}
