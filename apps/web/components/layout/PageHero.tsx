interface PageHeroProps {
  eyebrow: string;
  title: string;
  lead?: string;
}

export function PageHero({ eyebrow, title, lead }: PageHeroProps) {
  return (
    <section className="relative bg-[#0a0a0a] px-4 py-20 sm:px-6 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <span className="mb-[14px] block text-[11px] font-medium uppercase tracking-[0.4em] text-yellow opacity-85">
          {eyebrow}
        </span>
        <h1 className="font-medium text-[clamp(36px,6vw,56px)] tracking-[-0.02em] leading-[1.05] text-[#f8f7f2]">
          {title}
        </h1>
        {lead && (
          <p className="mt-4 text-[15px] font-light text-white/55 max-w-xl mx-auto">
            {lead}
          </p>
        )}
      </div>
    </section>
  );
}
