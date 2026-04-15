"Create a task doc using the task template. Fill only the sections relevant to this phase — skip sections that don't apply like payments, API routes, or strategic analysis. This phase is mostly cleanup and config, not new features."

How to Write Your Step-by-Step Instructions Going Forward
For each development phase, use this template in your head:
"We completed [previous step]. 
Now we're doing [this step] from the roadmap.

Context that matters: [1-2 specific things]
My constraints: [what's off limits]
Make decisions for: [technical stuff]
Ask me about: [business decisions only]
Output I need: [what does done look like]"
You don't have to write it exactly like this every time — once you internalize the structure, you'll write naturally but with the same thinking behind it.

What This Means for GoOut Hyd Right Now
You're about to start Phase 1A. Instead of me telling you what to do, try writing the prompt yourself using this framework. Think:

What did we just complete? (the planning docs)
What are we doing now? (Phase 1A — RAG cleanup)
What context does the agent need? (which files, what the template is)
What should it decide vs. ask you?
What does done look like?

Write it in your own words — natural, not robotic. I'll give you feedback on the prompt itself before we start the actual work. That way you learn the skill, not just the output.

Your Task
Write the prompt for Phase 1A yourself.
Use what you just learned. Don't copy the template word for word — write it naturally, like you're briefing a smart developer who just joined your team today.
Think through these before you write:

What did we just finish? (all the planning docs)
What are we starting now? (Phase 1A from the roadmap)
What context does the agent need? (which files to read, what the codebase currently is)
What should it decide vs. ask you about?
What does "Phase 1A complete" look like?

Don't overthink it. Write it like a human. One paragraph or five bullet points — whatever feels natural to you.
Post it here and I'll give you honest feedback on it before we touch any code.

You gave phase context — "we completed all planning docs"
You named the output clearly — branding, working database, images from Supabase
You defined when to ask — "if you need my decision, give me options"
It reads like a human, not a robot. That's the goal.

One Thing to Add Next Time
You didn't tell the agent where to find the plan. Right now I know the roadmap exists because we've been talking. But in a fresh IDE session, the agent would guess. One line fixes this:

"The detailed task list is in @roadmap.md under Phase 1A"

That's it. Small addition, saves a lot of wrong assumptions.

Verdict
8/10. Ready to build. Let's go.


anon = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibnJhdmZ5Ym50dG1wbnRoaHl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNzU4MjAsImV4cCI6MjA4OTc1MTgyMH0.nwjZiWXWUguaS09Lgtn2g173xgVolA2t0ODzQlns_vE


service = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibnJhdmZ5Ym50dG1wbnRoaHl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE3NTgyMCwiZXhwIjoyMDg5NzUxODIwfQ.B9r7AFnFMmLY79p_p9Sg6T1KOvadPF-zsYSQ7NN9LG8


postgresql://hidden:[YOUR-PASSWORD]@hidden:5432//postgres:[YOUR-PASSWORD]@db.kbnravfybnttmpnthhyv.supabase.co:5432/postgres

NEXT_PUBLIC_SUPABASE_URL=https://kbnravfybnttmpnthhyv.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_CuHE6M6QmiQlYh4WSPEbzw_xQn7ihdu

We completed Phase 1A — app boots clean, database connected, seed data in. Now starting Phase 1B from the roadmap.
Read roadmap.md Phase 1B for the full task list.
Specific decisions for shared components:
Navbar — GoOut Hyd wordmark left, "Made with love in Hyderabad" center, Partner with Us button right linking to /partner. Espresso background, cream text.
Footer — GoOut Hyd name + "Built for Hyderabadis" left side. Quick links center: Cafes, Events, Partner. Instagram right.
Every page uses these as shared components via the public layout.
Make technical decisions yourself. Ask me only if there's a UX decision I haven't covered.
Done when: Navbar and Footer render on the landing page, area constants and query functions are written, tsc passes clean
