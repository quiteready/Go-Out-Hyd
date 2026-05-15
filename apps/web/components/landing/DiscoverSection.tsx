import Link from "next/link";

const EVENT_LINK_CARDS = [
  {
    id: "live-music",
    tag: "Events",
    emoji: "🎸",
    title: "Live Music",
    href: "/events?category=live_music",
  },
  {
    id: "open-mic",
    tag: "Events",
    emoji: "🎙️",
    title: "Open Mic",
    href: "/events?category=open_mic",
  },
  {
    id: "workshop",
    tag: "Workshops",
    emoji: "🎨",
    title: "Workshop",
    href: "/events?category=workshop",
  },
  {
    id: "comedy-night",
    tag: "Events",
    emoji: "🎤",
    title: "Comedy Night",
    href: "/events?category=comedy_night",
  },
  {
    id: "gaming",
    tag: "Events",
    emoji: "🎮",
    title: "Gaming",
    href: "/events?category=gaming",
  },
] as const;

export function DiscoverSection() {
  return (
    <section id="discover" className="bg-white py-[80px] pb-[72px]">
      {/* Section header */}
      <div className="mx-auto mb-7 max-w-[1060px] px-6 lg:px-10" data-reveal>
        <h2 className="mb-1 font-sans font-medium text-[clamp(24px,4vw,36px)] text-[#1a1a1a]">
          What&apos;s on
        </h2>
        <p className="text-[14px] font-light text-[#999]">
          Explore Hyderabad
        </p>
      </div>

      <div className="mx-auto max-w-[1060px] px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-5">
          {EVENT_LINK_CARDS.map((card, index) => {
            const isLastOddMobile =
              EVENT_LINK_CARDS.length % 2 === 1 && index === EVENT_LINK_CARDS.length - 1;
            return (
            <Link
              href={card.href}
              key={card.id}
              className={`table-item w-full ${isLastOddMobile ? "col-span-2 mx-auto max-w-[320px] sm:col-span-1 sm:max-w-none" : ""}`}
              aria-label={`Open ${card.title} events`}
            >
              {/* Card surface — yellow top border via style prop to avoid Tailwind specificity issues */}
              <div
                className="h-full rounded-[10px] bg-white px-4 py-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-[box-shadow,transform] duration-300 hover:-translate-y-[3px] hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)] sm:px-[22px] sm:py-6"
                style={{
                  border: "1px solid rgba(0,0,0,0.06)",
                  borderTop: "2px solid #fbf497",
                }}
              >
                {/* Black pill tag */}
                <span className="mb-3 inline-block rounded-[3px] bg-[#0a0a0a] px-3 py-[3px] text-[9px] font-medium uppercase tracking-[2px] text-yellow">
                  {card.tag}
                </span>

                {/* Emoji */}
                <span className="mb-2 block text-[26px]">{card.emoji}</span>

                {/* Title — DM Sans 500, never serif */}
                <h3 className="mb-[3px] font-sans font-medium text-[18px] text-[#1a1a1a]">
                  {card.title}
                </h3>

                <p className="mt-4 text-[11px] font-medium tracking-[0.2px] text-[#0a0a0a]">
                  Explore →
                </p>
              </div>
            </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
