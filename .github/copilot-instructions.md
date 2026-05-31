# Workspace Instructions

Before responding to ANY request in this workspace — whether planning, coding, answering questions, or reviewing code — you MUST first read the following:

1. [AGENTS.md](../AGENTS.md) — project stack, conventions, build commands, domain rules, and directory structure.
2. **All instruction files in `.github/instructions/`** — read every file and apply whichever content is relevant to the current request:
   - [.github/instructions/auth.instructions.md](instructions/auth.instructions.md) — Clerk v7 auth conventions: middleware route protection, sign-in/sign-up pages, conditional UI, and anti-patterns.
   - [.github/instructions/ui-conventions.instructions.md](instructions/ui-conventions.instructions.md) — UI rules: shadcn/ui + Tailwind CSS only, full color-token reference (light & dark), button variants, responsive patterns, and prohibited dependencies.
   - [.github/instructions/data-fetching.instructions.md](instructions/data-fetching.instructions.md) — data fetching strategy: `/data` directory, server-side only, Drizzle ORM, auth validation before queries.
   - Any future files added to `.github/instructions/` must also be read.

These documents are the single source of truth for this project. All code you generate MUST conform to the rules and conventions defined in them. Never assume defaults from older framework versions — always defer to what is written in these files.
