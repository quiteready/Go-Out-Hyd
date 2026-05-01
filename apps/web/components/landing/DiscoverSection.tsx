"use client";

import { useState } from "react";

const DISCOVER_CARDS = [
  {
    id: "live-music",
    tag: "Events",
    emoji: "🎸",
    title: "Live Music",
    desc: "From indie gigs in basements to jazz sessions on rooftops.",
    samples: [
      "Lamakaan — Open Mic Wednesdays",
      "Harley's Bar & Kitchen",
      "Novotel Hyderabad",
    ],
  },
  {
    id: "comedy",
    tag: "Events",
    emoji: "🎤",
    title: "Comedy",
    desc: "Stand-up, improv, sketch — Hyderabad's scene is growing fast.",
    samples: ["Comedy Club HYD", "Canvas Laugh Club", "The Grid Cafe"],
  },
  {
    id: "workshops",
    tag: "Workshops",
    emoji: "🎨",
    title: "Workshops",
    desc: "Learn something. Make something. Leave with a new skill.",
    samples: ["Tilak Pottery Studio", "The Art Room", "Fabric & Form HYD"],
  },
  {
    id: "quiet-cafes",
    tag: "Cafes",
    emoji: "☕",
    title: "Quiet Cafes",
    desc: "For when you need a table for one and good light to work by.",
    samples: ["Roastery Coffee House", "Aromas of Coorg", "Filter Kaapi Co."],
  },
] as const;

export function DiscoverSection() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <section id="discover" className="bg-white py-[80px] pb-[72px]">
      {/* Section header */}
      <div className="mx-auto mb-7 max-w-[1060px] px-6 lg:px-10" data-reveal>
        <h2 className="mb-1 font-sans font-medium text-[clamp(24px,4vw,36px)] text-[#1a1a1a]">
          What&apos;s on
        </h2>
        <p className="text-[14px] font-light text-[#999]">
          Tap a card to see what&apos;s happening
        </p>
      </div>

      {/* Horizontal scroll with fade-out right edge */}
      <div className="discover-wrap relative">
        <div className="discover-scroll flex gap-5 overflow-x-auto px-6 pb-2 lg:px-10">
          {DISCOVER_CARDS.map((card) => {
            const isActive = activeId === card.id;
            return (
              <div
                key={card.id}
                className={`table-item flex-[0_0_300px] cursor-pointer md:flex-[0_0_320px]${
                  isActive ? " active" : ""
                }`}
                onClick={() => setActiveId(isActive ? null : card.id)}
                role="button"
                aria-expanded={isActive}
                aria-label={`${card.title} — tap to ${isActive ? "collapse" : "expand"}`}
              >
                {/* Card surface — yellow top border via style prop to avoid Tailwind specificity issues */}
                <div
                  className="rounded-[10px] bg-white px-[22px] py-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-[box-shadow,transform] duration-300 hover:-translate-y-[3px] hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)]"
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

                  {/* Description */}
                  <p className="text-[13px] font-light text-[#999]">
                    {card.desc}
                  </p>

                  {/* Expandable content — CSS grid row trick from globals.css */}
                  <div className="table-expanded-wrap">
                    <div>
                      <div className="table-expanded">
                        {card.samples.map((name) => (
                          <div key={name} className="sample-item">
                            {name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fade-out on right edge — matches bg-white of section */}
        <div
          className="pointer-events-none absolute bottom-2 right-0 top-0 w-16"
          style={{ background: "linear-gradient(90deg, transparent, #f8f7f2)" }}
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
