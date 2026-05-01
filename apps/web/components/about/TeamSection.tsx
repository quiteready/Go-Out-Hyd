import type { ReactElement } from "react";

interface TeamMember {
  initials: string;
  name: string;
  role: string;
}

const TEAM: TeamMember[] = [
  { initials: "W", name: "Wilson", role: "Founder" },
];

export function TeamSection(): ReactElement {
  return (
    <section className="bg-background px-4 py-14 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-medium text-foreground sm:text-3xl">
          The team
        </h2>
        <div className="mt-8 flex flex-wrap gap-8">
          {TEAM.map(({ initials, name, role }) => (
            <div key={name} className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-foreground/8">
                <span className="text-xl font-medium text-foreground">
                  {initials}
                </span>
              </div>
              <div>
                <p className="font-medium text-foreground">{name}</p>
                <p className="text-sm text-muted-foreground">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
