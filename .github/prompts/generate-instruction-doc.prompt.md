---
name: "Generate Instruction Doc"
description: "Generate or update a reference instruction .md file in docs/ for an architecture layer or coding standard, then update AGENTS.md to reference it."
argument-hint: "Layer or standard to document (e.g. 'auth layer', 'Drizzle conventions', 'API routes')"
agent: "Instruction Generator"
tools: [read, edit, search]
---

You are generating a concise, LLM-optimised reference document for this project's `docs/` directory.

## Step 1 — Gather Input

If the user has not provided any information about the layer or coding standard to document, ask:
> "What would you like to document? Examples: _auth layer (Clerk)_, _Drizzle ORM conventions_, _API route patterns_, _component structure_, _redirect logic_."

Do not proceed until a topic is provided.

## Step 2 — Check for Existing Docs

Before creating anything:
1. List files in `docs/`.
2. If a doc already covers this topic (fully or partially), re-scan the codebase for the current state and update the existing file to reflect what the code actually does today — do not duplicate.
3. If no match exists, create a new file: `docs/<topic-slug>.md` (kebab-case, lowercase).

## Step 3 — Explore the Codebase

Search the workspace for real examples relevant to the topic:
- Actual file paths, function signatures, import patterns
- Working code snippets (≤ 15 lines each) as illustration
- Conventions already in use — do not invent patterns

## Step 4 — Write the Document

Rules for the document:
- **Target audience**: an LLM agent reading this as context — not a human tutorial.
- **Length**: aim for 60–150 lines. If content exceeds ~150 lines, split into a primary doc and a companion `docs/<topic-slug>-advanced.md`, and link from the primary doc.
- **Format**:
  - H1 title
  - One-paragraph "What & Why" summary
  - Concise sections with headers — no verbose prose
  - Code blocks for every non-trivial pattern
  - A short "Anti-patterns / Pitfalls" section at the end
- Do **not** repeat information already in `AGENTS.md` verbatim — reference it instead.

## Step 5 — Update AGENTS.md

After saving the doc(s), add a reference line to the `## Docs Folder` section in `AGENTS.md`:

```
- [docs/<filename>.md](docs/<filename>.md) — <one-line description>
```

If that section does not yet exist in `AGENTS.md`, append it at the end.

If `AGENTS.md` does not exist, create it with an H1 heading `# AGENTS` and the `## Docs Folder` section, then add the reference line.

If a companion advanced doc was created, list both lines.

## Output

Confirm:
1. Which file(s) were created or updated in `docs/`.
2. What was added/changed in `AGENTS.md`.
3. Suggest the next related topic worth documenting (one sentence).
