---
description: UI conventions — shadcn/ui components, Tailwind CSS v4 color tokens, button variants, responsive design rules, and prohibited dependencies.
applyTo: "**/*.tsx, **/*.css"
---

# UI Conventions

UI is built exclusively with **shadcn/ui components** and **Tailwind CSS v4** utility classes. No additional UI libraries or icon packs may be added without explicit developer approval. Animations use `tw-animate-css` (already installed). Icons use `lucide-react` (already installed).

## Key Files

| File              | Responsibility                                                          |
| ----------------- | ----------------------------------------------------------------------- |
| `app/globals.css` | All CSS custom properties (color tokens, radius, fonts)                 |
| `components/ui/`  | shadcn/ui components — install via CLI only                             |
| `components.json` | shadcn config: style `base-nova`, baseColor `neutral`, CSS variables on |
| `app/layout.tsx`  | Root fonts (Geist Sans + Geist Mono), `antialiased`, flex column body   |

## Color Scheme

Colors are defined as OKLCH CSS variables in `app/globals.css`. All Tailwind color utilities (`bg-primary`, `text-muted-foreground`, etc.) resolve through these variables.

### Light Mode Tokens (`:root`)

| Token                    | Value                       | Use                                 |
| ------------------------ | --------------------------- | ----------------------------------- |
| `--background`           | `oklch(1 0 0)`              | Page background                     |
| `--foreground`           | `oklch(0.145 0 0)`          | Body text                           |
| `--primary`              | `oklch(0.205 0 0)`          | Primary button bg, key actions      |
| `--primary-foreground`   | `oklch(0.985 0 0)`          | Text on primary buttons             |
| `--secondary`            | `oklch(0.97 0 0)`           | Secondary button bg                 |
| `--secondary-foreground` | `oklch(0.205 0 0)`          | Text on secondary buttons           |
| `--muted`                | `oklch(0.97 0 0)`           | Subtle backgrounds, disabled states |
| `--muted-foreground`     | `oklch(0.556 0 0)`          | Placeholder text, captions          |
| `--accent`               | `oklch(0.97 0 0)`           | Hover / focus highlight bg          |
| `--destructive`          | `oklch(0.577 0.245 27.325)` | Error, delete actions (red)         |
| `--border`               | `oklch(0.922 0 0)`          | Default borders                     |
| `--input`                | `oklch(0.922 0 0)`          | Input field borders                 |
| `--ring`                 | `oklch(0.708 0 0)`          | Focus rings                         |
| `--card`                 | `oklch(1 0 0)`              | Card / panel background             |
| `--card-foreground`      | `oklch(0.145 0 0)`          | Text inside cards                   |

### Dark Mode Tokens (`.dark`)

| Token                  | Value                       |
| ---------------------- | --------------------------- |
| `--background`         | `oklch(0.145 0 0)`          |
| `--foreground`         | `oklch(0.985 0 0)`          |
| `--primary`            | `oklch(0.922 0 0)`          |
| `--primary-foreground` | `oklch(0.205 0 0)`          |
| `--card`               | `oklch(0.205 0 0)`          |
| `--muted`              | `oklch(0.269 0 0)`          |
| `--border`             | `oklch(1 0 0 / 10%)`        |
| `--input`              | `oklch(1 0 0 / 15%)`        |
| `--destructive`        | `oklch(0.704 0.191 22.216)` |

> Dark mode is activated by adding the `.dark` class to the `<html>` element. Use `next-themes` or a manual toggle — do not hardcode `dark:` classes for colors that are already covered by the token system.

### Modifying the Color Scheme

To change brand colors, only edit the CSS variable values in `app/globals.css` — never add a `tailwind.config.ts` (Tailwind v4 does not use one).

```css
/* app/globals.css — example: swap primary to indigo */
:root {
  --primary: oklch(0.45 0.2 264);
  --primary-foreground: oklch(0.985 0 0);
}
.dark {
  --primary: oklch(0.75 0.15 264);
  --primary-foreground: oklch(0.145 0 0);
}
```

## Button Variants

From `components/ui/button.tsx` (do not edit variant logic without a clear reason):

| Variant       | Use case                                                            |
| ------------- | ------------------------------------------------------------------- |
| `default`     | Primary actions — uses `bg-primary text-primary-foreground`         |
| `secondary`   | Secondary actions — uses `bg-secondary`                             |
| `outline`     | Bordered, transparent bg                                            |
| `ghost`       | Minimal, hover-only bg                                              |
| `destructive` | Delete / danger actions — uses `bg-destructive/10 text-destructive` |
| `link`        | Inline text links                                                   |

Sizes: `xs`, `sm`, `default`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`.

```tsx
<Button variant="default" size="default">Shorten URL</Button>
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="outline" size="icon"><CopyIcon /></Button>
```

## Responsive Design Rules

- **Mobile-first** — write base styles for small screens; use `sm:`, `md:`, `lg:`, `xl:` breakpoints to scale up.
- **No fixed pixel widths** on layout containers — use `w-full`, `max-w-*`, `container`, or `flex`/`grid` with gap.
- **Text scaling** — use responsive text utilities (`text-sm md:text-base lg:text-lg`) for headings and body copy.
- **Touch targets** — interactive elements must be at least `h-8` (32 px) tall; prefer `h-9`–`h-10` on mobile.
- **Stack on mobile, side-by-side on desktop** — use `flex flex-col sm:flex-row` or `grid grid-cols-1 md:grid-cols-2`.

```tsx
{
  /* Responsive card grid example */
}
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {urls.map((url) => (
    <UrlCard key={url.id} {...url} />
  ))}
</div>;
```

## Typography

| Class                   | Use                                     |
| ----------------------- | --------------------------------------- |
| `font-sans`             | Default body (`--font-geist-sans`)      |
| `font-mono`             | Code, short codes (`--font-geist-mono`) |
| `text-foreground`       | Primary text                            |
| `text-muted-foreground` | Secondary/caption text                  |

## Adding New shadcn Components

```bash
npx shadcn add <component-name>
```

Never copy-paste shadcn source manually. The CLI handles registry, variant, and dependency wiring.

## Anti-patterns / Pitfalls

- **Do not install** Radix UI primitives, Headless UI, MUI, Chakra, Mantine, or any other component library — shadcn already wraps `@base-ui/react` internally.
- **Do not add** new icon libraries (Heroicons, React Icons, etc.) — use `lucide-react` exclusively.
- **Do not hardcode hex/rgb colors** inline (`text-[#3b82f6]`) — always use a token (`text-primary`, `text-destructive`, etc.).
- **Do not create `tailwind.config.ts`** — Tailwind v4 reads config from `globals.css` via `@theme inline {}`.
- **Do not use `@apply` extensively** — prefer composing utilities in JSX; `@apply` is only acceptable in `@layer base`.
- **Do not forget `dark:` parity** — if you add a light-mode background class, verify the dark-mode token covers it.
