# ProcureX Design System

## Color Tokens — Violet-Purple Scale

| Token | Hex | Usage |
|---|---|---|
| primary-50 | #F5F3FF | Page background, card backgrounds |
| primary-100 | #EDE9FE | Subtle fills, input backgrounds |
| primary-200 | #DDD6FE | Borders, dividers |
| primary-300 | #C4B5FD | Decorative accents |
| primary-400 | #A78BFA | Sidebar active accent bar, icon tints |
| primary-500 | #8B5CF6 | Secondary interactive elements |
| primary-600 | #7C3AED | Primary CTA, buttons, focus rings |
| primary-700 | #6D28D9 | Button gradient end, hover states |
| primary-800 | #5B21B6 | Deep accent |
| primary-900 | #4C1D95 | Sidebar gradient end |
| primary-950 | #1E1B4B | Sidebar gradient start, darkest depth |

## Typography

### Display / Headings — Plus Jakarta Sans
- Font: `Plus Jakarta Sans` (Google Fonts, weights 300–800)
- Weight: 800 (ExtraBold)
- Letter-spacing: -0.03em
- Used on: all `<h1>`–`<h6>`, page titles, card titles

### Body — Inter
- Font: `Inter` (system fallback)
- Weight: 400 regular, 500 medium for labels, 600 semibold for nav/actions
- Letter-spacing for labels: 0.01em
- Used on: all body copy, labels, table content, form fields

### Scale reference
- text-xs (12px): badges, timestamps, table headers
- text-sm (14px): body, buttons, inputs, nav labels
- text-base (16px): section intros
- text-2xl (24px): stat card values
- text-3xl (30px): auth page headings
- text-4xl (36px): hero panel brand name

## Animation System

### Easing Curves
```
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1)   /* entering elements */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)  /* elements moving on-screen */
```

### Duration Scale
| Context | Duration |
|---|---|
| Button press | 100ms |
| Hover (colors, borders) | 150ms |
| Dropdowns, tooltips | 150ms |
| Stat card hover lift | 200ms |
| Page fade | 200ms |
| Auth card entry | 300ms |

### Entry Stagger
- Stat cards and table rows: 50ms delay per item
- Apply via `style={{ animationDelay: reducedMotion ? '0ms' : \`${i * 50}ms\` }}`
- Use `animate-fade-slide-up` CSS class (defined in Tailwind config)

### Reduced Motion Policy
- `@media (prefers-reduced-motion: reduce)`: all animation-duration and transition-duration forced to 0.01ms
- Motion `useReducedMotion()` hook: page transitions and JS-driven animations skip to instant
- Keep opacity transitions where they aid comprehension; remove transform-based movement

### Properties
- Only `transform` and `opacity`. Never animate `width`, `height`, `margin`, `padding`, `top`, or `left`.
- Never use `scale(0)` — always start from `scale(0.95)` or higher + `opacity: 0`
- In Motion (motion.dev), use full transform strings: `{ transform: 'translateY(0px)' }` not `{ y: 0 }`

## Component Patterns

### Sidebar — Dark Gradient
- Background: `linear-gradient(180deg, #1E1B4B 0%, #2D1B69 50%, #4C1D95 100%)`
- Width: 240px expanded, 64px collapsed
- Collapse transition: `width 200ms cubic-bezier(0.23, 1, 0.32, 1)`
- Active link: `bg-white/10` + white text + 3px left accent bar (`#A78BFA`)
- Hover: `bg-white/5` + white text
- No border — gradient provides sufficient visual separation

### Card Elevation System
- Level 0 (flat): `border border-primary-100` only — for table wrappers, secondary cards
- Level 1 (default): `border border-primary-100 shadow-sm` — stat cards, form panels
- Level 2 (elevated/hover): `shadow-md` (applied on hover, not both simultaneously) — never shadow + strong border together
- Border radius: 12px (`rounded-xl`) standard, 16px (`rounded-2xl`) for cards and modals

### Button Gradient
- Primary: `linear-gradient(135deg, #7C3AED, #6D28D9)`
- Hover: `filter: brightness(1.1)` — keeps gradient, no color swap needed
- Press: `scale(0.97)` 100ms — haptic-like feedback
- Focus ring: `ring-2 ring-primary-500 ring-offset-2`

### Auth Pages — Split Panel
- Left panel (hero): `linear-gradient(135deg, #1E1B4B 0%, #4C1D95 60%, #7C3AED 100%)` + geometric SVG decoration
- Right panel (form): white background, centered max-w-md form
- Mobile: hero panel hidden (`hidden lg:flex`), form takes full viewport

### Page Transitions
- Opacity fade only (0 → 1, 200ms) — no position change to prevent layout shift
- Implemented via Motion `AnimatePresence` + `motion.div` keyed on `location.pathname`
- `mode="wait"` ensures outgoing page fades before incoming renders
