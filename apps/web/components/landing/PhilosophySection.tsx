export function PhilosophySection() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-[1060px] grid-cols-1 gap-5 px-6 py-[72px] md:grid-cols-2 md:gap-12 md:py-[100px] lg:px-10">
        {/* Left — editorial heading with DM Serif Display */}
        <div className="self-start" data-reveal>
          <h2 className="font-display text-[clamp(26px,4vw,42px)] leading-[1.35] text-[#1a1a1a]">
            We don&apos;t list places.{" "}
            We&nbsp;map&nbsp;
            <em className="not-italic bg-yellow px-1 text-black">moods.</em>
          </h2>
        </div>

        {/* Right — body copy */}
        <div className="self-end" data-reveal>
          <p className="max-w-[340px] text-[15px] font-light leading-[1.85] text-[#999] md:max-w-full">
            Hyderabad has a million places to sit. We&apos;re curating the ones
            worth leaving your house for — the basement comedy clubs, the
            all-day brunch spots, the gigs that aren&apos;t on anyone&apos;s
            radar yet.
          </p>
        </div>
      </div>
    </section>
  );
}
