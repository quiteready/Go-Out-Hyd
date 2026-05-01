"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const HERO_SRC =
  "https://images.unsplash.com/photo-1572427401206-c0e90ac69e3a?auto=format&fit=crop&w=1600&q=80";

export function HeroSection() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Parallax — translate the image wrapper on scroll
  useEffect(() => {
    const onScroll = () => {
      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `translateY(${
          window.scrollY * 0.3
        }px)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative h-[100dvh] overflow-hidden bg-[#0a0a0a]">
      {/* Parallax wrapper — Image inside gets Ken Burns */}
      <div
        ref={wrapperRef}
        className="absolute inset-[-20px] h-[calc(100%+40px)] w-[calc(100%+40px)] will-change-transform"
      >
        <Image
          src={HERO_SRC}
          alt="Charminar, Hyderabad"
          fill
          priority
          sizes="100vw"
          className="hero-ken-burns object-cover [filter:saturate(0.6)_contrast(1.1)_brightness(0.85)]"
        />
      </div>

      {/* Yellow frame — thin, confident */}
      <div className="hero-frame" aria-hidden="true" />

      {/* Dark gradient overlay */}
      <div className="hero-overlay absolute inset-0 z-[2] flex items-center justify-center">
        <div
          className="relative z-[4] w-full max-w-[700px] px-6 text-left"
          data-reveal
        >
          {/* City eyebrow */}
          <span className="mb-[14px] block text-[11px] font-medium uppercase tracking-[0.4em] text-yellow opacity-85">
            Hyderabad
          </span>

          {/* Wordmark — DM Sans 500, never serif */}
          <h1 className="mb-[22px] leading-[0.88] ml-[-3mm]">
            <span className="block font-sans font-medium text-[clamp(52px,13vw,144px)] tracking-[-0.02em] text-white [text-shadow:0_0_60px_rgba(10,10,10,0.5)]">
              GoOut
            </span>
            <span className="block font-sans font-medium text-[clamp(52px,13vw,144px)] tracking-[-0.02em] text-white [text-shadow:0_0_60px_rgba(10,10,10,0.5)]">
              Hyd.
            </span>
          </h1>

          {/* Yellow rule */}
          <hr className="mb-[18px] h-[2px] w-12 border-none bg-yellow opacity-70" />

          {/* Subtitle */}
          <p className="max-w-[360px] text-[clamp(14px,2.2vw,17px)] font-light tracking-[0.015em] text-white opacity-50">
            Everything happening in the city
          </p>

          {/* CTAs */}
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/events"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[6px] bg-yellow px-6 text-[13px] font-medium tracking-[0.02em] text-black transition-opacity hover:opacity-85"
            >
              Explore
            </Link>
            <Link
              href="/events"
              className="inline-flex min-h-[44px] items-center justify-center rounded-[6px] border border-white/25 bg-transparent px-6 text-[13px] font-light tracking-[0.02em] text-white transition-colors hover:border-white/50"
            >
              Find your area
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll cue — CSS animates in after 2.5s */}
      <div
        className="hero-scroll-cue absolute bottom-7 left-1/2 z-[3]"
        aria-hidden="true"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 3v10m0 0L4 9m4 4l4-4"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  );
}
