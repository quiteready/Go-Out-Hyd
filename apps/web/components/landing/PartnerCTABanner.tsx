import Link from "next/link";

const PARTNER_CARDS = [
  {
    id: "cafe",
    emoji: "☕",
    heading: "Own a cafe?",
    body: "List your space and reach the people who are always looking for their next favourite spot.",
    cta: "List your cafe",
    href: "/partner",
  },
  {
    id: "event",
    emoji: "🎤",
    heading: "Running an event?",
    body: "Post your gig, workshop, or pop-up and we'll help you fill the room.",
    cta: "Post an event",
    href: "/partner#event-submit",
  },
] as const;

export function PartnerCTABanner() {
  return (
    <section className="bg-[#0a0a0a] px-6 py-[100px]">
      <div className="mx-auto max-w-[1060px]" data-reveal>
        {/* Two cards side-by-side — stack on mobile */}
        <div className="mb-9 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
          {PARTNER_CARDS.map((card) => (
            <div
              key={card.id}
              className="flex h-full flex-col rounded-[10px] border border-white/[0.06] bg-[#141414] p-7 text-left"
            >
              <span className="mb-3 block text-2xl">{card.emoji}</span>
              <h3 className="mb-2 font-sans font-medium text-[18px] text-white">
                {card.heading}
              </h3>
              <p className="mb-[18px] text-[13px] font-light leading-[1.6] text-[#999]">
                {card.body}
              </p>
              <Link
                href={card.href}
                className="mt-auto inline-flex min-h-[42px] w-fit items-center justify-center rounded-[6px] bg-yellow px-6 text-[13px] font-medium tracking-[0.02em] text-black shadow-[0_2px_12px_rgba(251,244,151,0.2)] transition-opacity hover:opacity-85"
              >
                {card.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-[12px] font-light text-white/35">
          No upfront fees. Just show up.
        </p>
      </div>
    </section>
  );
}
