export function WinkBand() {
  return (
    <section className="relative overflow-hidden bg-[#0a0a0a] px-6 py-[68px] text-center">
      {/* Radial glow — decorative only */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(251,244,151,0.05) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      {/* The one line. font-display — second permitted use of DM Serif Display. */}
      <p
        className="relative font-display text-[clamp(24px,6vw,48px)] tracking-[0.01em] text-yellow opacity-75"
        data-reveal
      >
        Hyderabad ki baithak.
      </p>
    </section>
  );
}
