const MARQUEE_ITEMS = [
  "Live Music", "Comedy Nights", "Open Mics", "Workshops",
  "Art Shows", "Cafe Crawls", "Poetry Slams", "Jazz Evenings",
  "Film Screenings", "Book Clubs",
];

const TRACK = MARQUEE_ITEMS.join(" · ") + " · ";

export function MarqueeStrip() {
  return (
    <div
      className="overflow-hidden border-b border-[rgba(251,244,151,0.08)] bg-black py-3"
      aria-hidden="true"
    >
      <div
        className="marquee-track flex whitespace-nowrap"
        style={{ animation: "mscroll 30s linear infinite", willChange: "transform" }}
      >
        <span className="flex-shrink-0 pr-11 text-[10.5px] font-normal uppercase tracking-[0.28em] text-yellow opacity-25">
          {TRACK.repeat(4)}
        </span>
        <span className="flex-shrink-0 pr-11 text-[10.5px] font-normal uppercase tracking-[0.28em] text-yellow opacity-25">
          {TRACK.repeat(4)}
        </span>
      </div>
    </div>
  );
}
