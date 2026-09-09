# Theme & Design System — Neo-Brutalist App

> **Purpose:** This document is the source of truth for the visual design, interaction language, component behavior, layout system, typography, color tokens, motion, accessibility, responsive behavior, and implementation rules for the hackathon application.
>
> **Primary reference:** the supplied Neo-Brutalism UI reference screenshot. The implementation should capture its **visual DNA**, not copy individual screens: oversized black outlines, hard shadows, high-contrast typography, deliberately playful color blocking, compact utility controls, sticker-like UI objects, and a strong editorial/experimental feel.

---

## 0. Design North Star

### The one-sentence rule

**Make the interface feel like a high-quality digital poster, editorial dashboard, and physical sticker board collided — while keeping the product fast, obvious, usable, and accessible.**

Neo-brutalism is not simply:

- black borders
- random bright colors
- giant text
- intentionally ugly UI

The system must combine:

1. **Brutalist structure** — visible hierarchy, strong outlines, minimal decoration, no ambiguous affordances.
2. **Editorial composition** — dramatic typography, asymmetric blocks, oversized section titles.
3. **Playful utility** — tags, badges, stickers, floating objects, tiny status indicators.
4. **Physicality** — hard shadows and small offset movement make controls feel tactile.
5. **Modern product UX** — predictable navigation, responsive layouts, accessible controls, clear feedback.

### Quality bar

The application should feel:

- bold without becoming chaotic
- playful without becoming childish
- experimental without becoming confusing
- colorful without losing contrast
- dense when useful, spacious when important
- handcrafted while still being systematically designed

---

# 1. Visual DNA

## 1.1 Core visual characteristics

Every major screen should use several of these principles:

| Principle | Implementation |
|---|---|
| Thick outline | Usually `2–3px`, almost-black |
| Hard shadow | Offset shadow, no blur |
| High contrast | Near-black text against light surfaces |
| Flat color | Solid fills over gradients |
| Color blocks | Yellow, pink, lavender, mint, coral, blue |
| Large type | Oversized headings and editorial statements |
| Rounded geometry | Moderate, intentional corner radius rather than glassy pills everywhere |
| Offset movement | Hover/press states physically move elements |
| Visible structure | Containers and boundaries should be obvious |
| Sticker feel | Labels, badges and micro-elements can overlap cards |
| Imperfect energy | Asymmetry is welcome, but alignment remains controlled |
| Minimal effects | Avoid blur, frosted glass, excessive gradients, subtle shadows |

## 1.2 What this system is NOT

Do not introduce:

- glassmorphism
- translucent frosted panels
- excessive gradients
- soft 20–40px shadows
- ultra-thin 1px borders
- monochrome enterprise dashboards
- generic rounded SaaS cards
- excessive pill-shaped UI
- low-contrast gray-on-gray text
- floating blobs with no semantic purpose
- random rotations on every component
- animation for animation's sake

---

# 2. Design Principles

## Principle A — Structure must be visible

Users should be able to visually understand:

- what is a container
- what is clickable
- what is active
- what is secondary
- where one section ends
- what action is primary

Use borders, spacing, typography and color to communicate hierarchy.

## Principle B — One loud idea per viewport

A screen can be expressive, but it should have a dominant visual statement.

Examples:

- hero headline
- primary search/action
- featured result
- main workflow step
- important metric

Do not give five elements equal visual weight.

## Principle C — Color has a job

Colors are semantic and structural, not decoration.

Recommended roles:

- Yellow → primary attention / action
- Pink → playful accent / highlight
- Lavender → secondary information
- Mint → success / positive state
- Coral → warning / attention
- Blue → informational / navigation
- Black → structure / text / borders
- Cream → warm neutral surface

## Principle D — Physical interaction

Interactive elements should feel like objects.

Default button:

```text
REST
┌─────────────────────┐
│       PLAN TRIP     │
└─────────────────────┘
          █████
          █████ shadow

HOVER
┌─────────────────────┐
│       PLAN TRIP     │
└─────────────────────┘
       █████
       █████ shadow

PRESS
┌─────────────────────┐
│       PLAN TRIP     │
└─────────────────────┘
```

The exact effect should be implemented as a small translation toward the shadow, not a soft scaling animation.

## Principle E — Delight should never compromise usability

Neo-brutalism is expressive at the visual layer. UX remains conventional:

- buttons look like buttons
- links look like links
- forms have labels
- loading states are explicit
- errors are readable
- keyboard focus is visible
- mobile controls remain reachable

---

# 3. Design Tokens

All values below should be implemented as centralized design tokens.

## 3.1 Color system

### Base palette

```css
:root {
  /* Core */
  --color-black: #111111;
  --color-ink: #171717;
  --color-white: #FFFFFF;
  --color-paper: #FFFDF7;
  --color-cream: #F6F0E5;

  /* Neo-brutalist accents */
  --color-yellow: #F7E84F;
  --color-yellow-bright: #FFF23B;
  --color-pink: #F5B7D2;
  --color-pink-bright: #FF8FC4;
  --color-lavender: #CFC7F4;
  --color-purple: #8E7CFF;
  --color-mint: #AEE8C5;
  --color-mint-strong: #65D69A;
  --color-coral: #FF8D72;
  --color-orange: #FFB15C;
  --color-blue: #9BB9FF;
  --color-sky: #B9E7F4;
  --color-red: #FF5C5C;

  /* Neutral UI */
  --color-gray-50: #FAFAF8;
  --color-gray-100: #F2F2EF;
  --color-gray-200: #E3E3DE;
  --color-gray-300: #C8C8C2;
  --color-gray-400: #96968F;
  --color-gray-500: #6D6D66;
  --color-gray-600: #4D4D47;
  --color-gray-700: #353532;
  --color-gray-800: #222222;
}
```

### Recommended semantic aliases

Do not hardcode accent colors throughout the application.

```css
:root {
  --bg-page: var(--color-paper);
  --bg-surface: var(--color-white);
  --bg-surface-muted: var(--color-cream);

  --text-primary: var(--color-black);
  --text-secondary: var(--color-gray-600);
  --text-muted: var(--color-gray-500);
  --text-inverse: var(--color-white);

  --border-default: var(--color-black);
  --border-muted: var(--color-gray-300);

  --action-primary: var(--color-yellow);
  --action-secondary: var(--color-pink);

  --state-success: var(--color-mint-strong);
  --state-warning: var(--color-orange);
  --state-error: var(--color-red);
  --state-info: var(--color-blue);
}
```

## 3.2 Color usage ratio

A typical screen should roughly follow:

- **55–70%** neutral/white/cream
- **15–25%** black/ink
- **10–20%** accent colors

Avoid turning the entire page into a rainbow.

### Accent distribution rule

Use **one dominant accent + one supporting accent** per major composition.

Example:

```text
Page background: cream
Primary CTA: yellow
Secondary card: lavender
Text/borders: black
Success: mint
```

Do not place yellow + pink + purple + blue + green + orange at full saturation in the same hero unless the screen is intentionally an illustration.

---

# 4. Typography

## 4.1 Font direction

Preferred primary font:

**Geist**

Use:

- Geist Sans for interface/body
- Geist Mono for metadata, IDs, technical values and utility labels

Fallback:

```css
font-family: Geist, Inter, ui-sans-serif, system-ui, sans-serif;
```

Mono:

```css
font-family: "Geist Mono", "JetBrains Mono", ui-monospace, monospace;
```

## 4.2 Type hierarchy

```css
--font-display: 800;
--font-heading: 750;
--font-semibold: 650;
--font-medium: 550;
--font-regular: 400;
```

### Display

Desktop:

- 72px–112px
- line-height: 0.88–0.98
- letter-spacing: -0.055em
- weight: 800

Use for:

- landing hero
- major product statement
- giant number/metric
- major campaign statement

Example:

```text
PLAN
YOUR
NEXT
MOVE.
```

### H1

- 48–72px
- line-height: 0.95–1.05
- weight: 800
- tracking: -0.04em

### H2

- 32–48px
- line-height: 1.0–1.08
- weight: 800
- tracking: -0.035em

### H3

- 22–30px
- line-height: 1.1
- weight: 750

### Body large

- 18px
- line-height: 1.45
- weight: 450–500

### Body

- 15–16px
- line-height: 1.45–1.55
- weight: 450

### Small

- 13–14px
- line-height: 1.35–1.45

### Micro / utility

- 10–12px
- uppercase where appropriate
- weight: 700–800
- letter spacing: 0.06–0.12em

Example:

```text
TRIP STATUS
LIVE
```

## 4.3 Typography rules

### Do

- use bold type to create hierarchy
- use short headings
- break hero headings into intentional lines
- use mono for machine-like metadata
- use uppercase selectively

### Don't

- use 5 different font families
- use thin 200-weight text
- make paragraphs huge
- uppercase entire paragraphs
- use decorative fonts for core UI

---

# 5. Spacing System

Use a 4px base grid.

```css
--space-0: 0px;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-7: 28px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-14: 56px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
--space-32: 128px;
```

## Spacing philosophy

Neo-brutalist UI can be visually dense, but the underlying spacing must remain systematic.

Recommended:

- page padding desktop: 32–64px
- page padding tablet: 24–40px
- page padding mobile: 16–20px
- card internal padding: 20–32px
- compact card: 16–20px
- button horizontal padding: 18–24px
- section gap: 64–120px
- related control gap: 8–16px

---

# 6. Borders

## 6.1 Primary border

```css
--border-width: 2px;
--border-width-heavy: 3px;
--border-color: #111111;
```

Use:

- 2px for most UI
- 3px for hero cards / featured blocks / major controls
- 1px only for subtle internal dividers

## 6.2 Border rule

If an element has a visual role, give it a clear edge.

Prefer:

```css
border: 2px solid #111111;
```

Avoid:

```css
border: 1px solid rgba(0,0,0,0.08);
```

for primary containers.

---

# 7. Shadows

The signature shadow is **hard, offset, and unblurred**.

```css
--shadow-xs: 2px 2px 0 #111111;
--shadow-sm: 3px 3px 0 #111111;
--shadow-md: 5px 5px 0 #111111;
--shadow-lg: 8px 8px 0 #111111;
--shadow-xl: 12px 12px 0 #111111;
```

### Component defaults

| Component | Shadow |
|---|---|
| Small button | `3px 3px 0 #111` |
| Standard button | `4px 4px 0 #111` |
| Card | `5px 5px 0 #111` |
| Featured card | `7px 7px 0 #111` |
| Hero block | `8px 8px 0 #111` |
| Floating modal | `10px 10px 0 #111` |

### Never

```css
box-shadow: 0 12px 40px rgba(0,0,0,.15);
```

The interface should not look like a modern fintech dashboard.

---

# 8. Corner Radius

Neo-brutalism should not mean zero radius everywhere.

Recommended tokens:

```css
--radius-none: 0px;
--radius-xs: 4px;
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;
--radius-xl: 18px;
--radius-pill: 999px;
```

### Usage

- cards: 10–14px
- buttons: 8–10px
- inputs: 8–10px
- modal: 14–18px
- badges: 6–8px
- avatars: circular
- pills: only when semantically useful

Avoid applying `rounded-full` to everything.

---

# 9. Layout System

## 9.1 Maximum width

```css
--container-max: 1440px;
```

Recommended:

```css
.container {
  width: min(100% - 32px, 1440px);
  margin-inline: auto;
}
```

Large desktop:

```text
┌──────────────────────────────────────────────────────────┐
│                       PAGE                               │
│   ┌──────────────────────────────────────────────────┐   │
│   │                MAX 1440px                        │   │
│   └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## 9.2 Grid

Base grid:

- 12 columns desktop
- 8 columns tablet
- 4 columns mobile

Desktop gutter:

- 20–32px

Mobile gutter:

- 12–16px

## 9.3 Asymmetry

Asymmetry is encouraged when it improves visual energy.

Example:

```text
┌─────────────────────────────┐
│             HERO            │
│                             │
│ BIG HEADING                 │
│                             │
│             ┌──────────────┐│
│             │ STICKER      ││
│             └──────────────┘│
└─────────────────────────────┘
```

But the underlying grid must still be respected.

### Rule

**Asymmetric appearance, symmetric system.**

---

# 10. Buttons

Buttons are one of the most important neo-brutalist primitives.

## 10.1 Primary button

Visual specification:

```css
.primary-button {
  background: #F7E84F;
  color: #111111;
  border: 2px solid #111111;
  border-radius: 9px;
  box-shadow: 4px 4px 0 #111111;

  min-height: 48px;
  padding-inline: 20px;

  font-weight: 750;
}
```

### Rest

- background: yellow
- black border
- black hard shadow
- strong text
- no gradient

### Hover

Move toward the shadow:

```css
transform: translate(2px, 2px);
box-shadow: 2px 2px 0 #111111;
```

### Active / pressed

```css
transform: translate(4px, 4px);
box-shadow: 0 0 0 #111111;
```

### Focus

Never rely only on color.

```css
outline: 3px solid #8E7CFF;
outline-offset: 3px;
```

### Disabled

- opacity: 0.45–0.55
- cursor: not-allowed
- shadow reduced
- no hover movement

## 10.2 Secondary button

```text
BACKGROUND: WHITE
BORDER: BLACK
SHADOW: BLACK
```

Use for:

- cancel
- alternate navigation
- secondary actions

## 10.3 Destructive button

Use coral/red only when the action is destructive.

```css
background: #FF8D72;
border: 2px solid #111111;
box-shadow: 4px 4px 0 #111111;
```

Do not make destructive actions look like primary success actions.

## 10.4 Ghost button

Ghost buttons should still have strong text and a clear interaction area.

Default:

```text
transparent
2px black border
```

Hover:

```text
black background
white text
```

## 10.5 Icon button

Minimum touch target:

```text
44 × 44px
```

Preferred:

```text
44–48px
```

Visual:

- square or mildly rounded
- 2px black border
- hard shadow
- icon centered
- tooltip only when necessary

## 10.6 Button sizes

| Size | Height | Horizontal padding | Font |
|---|---:|---:|---:|
| XS | 32px | 12px | 12px |
| SM | 40px | 16px | 13px |
| MD | 48px | 20px | 14–15px |
| LG | 56px | 24px | 16px |
| XL | 64px | 28px | 17–18px |

---

# 11. Cards

Cards should feel like physical pieces of paper pinned onto a board.

## 11.1 Standard card

```css
.card {
  background: #FFFFFF;
  border: 2px solid #111111;
  border-radius: 12px;
  box-shadow: 5px 5px 0 #111111;
  padding: 24px;
}
```

## 11.2 Colored card

Use accent fills.

Examples:

```text
yellow
pink
lavender
mint
coral
blue
```

Text should remain black unless contrast requires otherwise.

## 11.3 Card anatomy

```text
┌────────────────────────────────────────┐
│ LABEL                          ACTION  │
│                                        │
│ LARGE TITLE                            │
│ Short supporting description.          │
│                                        │
│ ┌──────────┐  ┌──────────┐             │
│ │ METRIC   │  │ METRIC   │             │
│ └──────────┘  └──────────┘             │
│                                        │
│ [ PRIMARY ACTION ]                     │
└────────────────────────────────────────┘
      █████████████████████████████████
```

## 11.4 Card hover

Default:

```css
transform: translate(0, 0);
box-shadow: 5px 5px 0 #111;
```

Hover:

```css
transform: translate(-2px, -2px);
box-shadow: 7px 7px 0 #111;
```

This creates the illusion that the card lifts upward.

### Important

Do not use:

```css
transform: scale(1.03);
```

as the primary card hover behavior. Scaling changes layout perception and makes dense grids feel unstable.

## 11.5 Clickable card

If the entire card is clickable:

- show cursor pointer
- increase shadow on hover
- add subtle offset
- ensure keyboard focus
- provide a visible focus ring
- do not place multiple conflicting click targets inside without clear hierarchy

---

# 12. Featured / Hero Cards

Featured cards can use:

- 3px border
- 7–10px hard shadow
- oversized type
- large accent background
- decorative sticker
- asymmetric internal layout

Example:

```text
┌───────────────────────────────────────────────────┐
│ ★ FEATURED                                        │
│                                                   │
│        PLAN YOUR                                  │
│        PERFECT                                    │
│        GETAWAY.              ┌───────────────┐    │
│                              │  STICKER      │    │
│                              │  ✦ 2026 ✦     │    │
│                              └───────────────┘    │
│                                                   │
│ [ START PLANNING ]                                │
└───────────────────────────────────────────────────┘
      █████████████████████████████████████████
```

---

# 13. Badges, Tags & Chips

## Badge

Use for:

- status
- category
- AI-generated
- live
- recommended

```css
.badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 10px;

  border: 2px solid #111;
  border-radius: 6px;

  font-size: 12px;
  font-weight: 800;
}
```

### Example

```text
┌──────────────┐
│ ✦ AI PLANNED │
└──────────────┘
```

Avoid 20px-high tiny badges that become unreadable.

---

# 14. Inputs & Forms

Forms should look tactile and highly legible.

## 14.1 Text input

```css
.input {
  min-height: 48px;
  background: #FFFFFF;
  border: 2px solid #111111;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 15px;
}
```

## 14.2 Input focus

```css
border-color: #111111;
box-shadow: 4px 4px 0 #CFC7F4;
```

Do not use an extremely soft blue browser-like focus ring as the only indication.

## 14.3 Label

```text
DESTINATION
[ Dubai, UAE                         ]
```

Label:

- 12–13px
- bold
- uppercase or sentence case
- high contrast
- 6–8px gap before input

## 14.4 Placeholder

Use muted gray.

Never use placeholder text as the only field label.

## 14.5 Error

Error state:

- border: 2px black
- supporting background: coral/pale red
- explicit error message
- icon optional
- no color-only error indication

Example:

```text
DESTINATION
[                               ]

! Enter a destination to continue.
```

---

# 15. Selects / Dropdowns

Dropdown triggers should visually match inputs.

```text
┌────────────────────────────────────┐
│ SELECT DATE                    ▼   │
└────────────────────────────────────┘
```

Dropdown menu:

- white/cream background
- 2px black border
- 4–6px hard shadow
- individual options with 8–12px padding
- selected option uses yellow/lavender background
- hover uses light accent background

---

# 16. Navigation

## 16.1 Desktop navigation

Preferred structure:

```text
┌──────────────────────────────────────────────────────────┐
│ LOGO       Explore   Trips   Saved   About      [ PLAN ]│
└──────────────────────────────────────────────────────────┘
```

Use a clear 2px bottom or outer border where appropriate.

## 16.2 Mobile navigation

Use a bottom navigation only when there are 3–5 primary destinations.

```text
┌────────────────────────────────────────┐
│                                        │
│              CONTENT                   │
│                                        │
├────────────────────────────────────────┤
│  HOME    EXPLORE    PLAN    SAVED  ME  │
└────────────────────────────────────────┘
```

Active destination:

- black icon/text
- yellow or pink backing
- 2px border if using a boxed active state

---

# 17. Navigation Interaction

### Link hover

Do not make links disappear or fade.

Preferred:

```css
text-decoration-thickness: 2px;
text-underline-offset: 4px;
```

or a small black/yellow highlight.

### Active navigation

Use:

- color
- underline
- background
- icon change

Never rely only on color.

---

# 18. Icons

Use one consistent icon library.

Recommended:

- Lucide
- Phosphor
- another consistent SVG icon system

Rules:

- default stroke: 2px
- avoid mixing filled and outlined icon families randomly
- icon size 16–24px for controls
- 28–40px for feature illustrations
- align icon optically, not just mathematically

Icons should support the interface rather than become decorative noise.

---

# 19. Illustrations & Decorative Objects

Neo-brutalist interfaces benefit from decorative elements.

Good decorative objects:

- stars
- arrows
- hand-drawn circles
- mini labels
- smileys
- stickers
- squiggles
- tiny stars
- rough paper shapes
- badges
- stamps

### Decorative rule

A decorative element must either:

1. establish hierarchy,
2. reinforce the product personality,
3. guide attention,
4. make a section memorable.

If it does none of these, remove it.

---

# 20. Sticker System

Use stickers as independent UI layers.

```text
      ┌──────────────┐
      │ ✦ HOT PICK   │
      └──────────────┘
              \
               \
┌─────────────────────────────┐
│                             │
│           CARD              │
│                             │
└─────────────────────────────┘
```

Sticker tokens:

```css
--sticker-border: 2px;
--sticker-shadow: 3px 3px 0 #111;
--sticker-radius: 6px;
```

Optional controlled rotations:

```css
rotate: -2deg;
rotate: 1.5deg;
rotate: -1deg;
```

### Important

Do not rotate primary functional controls.

Rotation is for:

- labels
- stickers
- illustrations
- decorative cards

---

# 21. Tables

Tables can be brutalist without becoming visually overwhelming.

```text
┌────────────┬──────────────┬──────────────┐
│ ITEM       │ STATUS       │ VALUE        │
├────────────┼──────────────┼──────────────┤
│ Hotel      │ CONFIRMED    │ AED 420      │
├────────────┼──────────────┼──────────────┤
│ Flight     │ PENDING      │ AED 890      │
└────────────┴──────────────┴──────────────┘
```

Rules:

- 2px outer border
- 1–2px internal dividers
- bold headers
- strong row hover
- enough vertical padding
- avoid tiny 11px body text

Mobile tables should transform into stacked cards when horizontal scrolling would hurt usability.

---

# 22. Modals

Modal:

```css
background: #FFFDF7;
border: 3px solid #111111;
border-radius: 14px;
box-shadow: 10px 10px 0 #111111;
```

Overlay:

```css
background: rgba(17, 17, 17, 0.45);
```

Do not use a blurred backdrop.

Modal anatomy:

```text
┌───────────────────────────────────────┐
│ TITLE                            ×    │
├───────────────────────────────────────┤
│                                       │
│ Content                               │
│                                       │
├───────────────────────────────────────┤
│                 [ CANCEL ] [ CONFIRM ]│
└───────────────────────────────────────┘
          █████████████████████████
```

---

# 23. Toasts & Notifications

Toasts should feel like small physical notes.

```text
┌────────────────────────────────┐
│ ✓ TRIP SAVED                   │
│ Your itinerary is ready.       │
└────────────────────────────────┘
       █████████████████████
```

Use:

- 2px black border
- 4px hard shadow
- white / mint / yellow background
- clear dismiss action

Position:

- desktop: top-right or bottom-right
- mobile: bottom with safe-area spacing

---

# 24. Loading States

Avoid generic gray skeletons when the brand can support better feedback.

### Skeleton

Still use skeletons for layout stability.

```text
┌───────────────────────────┐
│ ███████████████           │
│ ████████████████████      │
│ ███████                   │
└───────────────────────────┘
```

Use muted neutral fills, not animated rainbow gradients.

### AI generation

For AI work, use a branded status:

```text
✦ BUILDING YOUR PLAN...

[ SEARCHING ] → [ FILTERING ] → [ ORGANIZING ]
```

The state should communicate progress rather than simply spinning.

---

# 25. Empty States

Empty states should be useful and playful.

Structure:

```text
          ✦

      NOTHING HERE YET

  Your saved plans will appear
  here once you create one.

       [ CREATE PLAN ]
```

Use a small illustration/sticker if appropriate.

---

# 26. Error States

Never display:

```text
Something went wrong.
```

alone.

Instead:

```text
WE HIT A ROADBLOCK

We couldn't load your itinerary.
Your previous plan is still safe.

[ TRY AGAIN ]   [ GO BACK ]
```

Errors should explain:

- what happened
- whether data is safe
- what the user can do next

---

# 27. Motion System

Motion should reinforce physicality.

## 27.1 Timing tokens

```css
--duration-fast: 100ms;
--duration-standard: 160ms;
--duration-slow: 240ms;
--duration-emphasis: 360ms;
```

## 27.2 Easing

Prefer:

```css
--ease-standard: cubic-bezier(.2,.8,.2,1);
--ease-snappy: cubic-bezier(.7,0,.3,1);
```

## 27.3 Button interaction

```text
hover: 100–140ms
press: 70–100ms
```

## 27.4 Card interaction

```text
hover: 160ms
```

## 27.5 Page transitions

Use restrained transitions.

Avoid:

- huge zoom transitions
- long fades
- cinematic route animations
- content flying from random directions

---

# 28. Reduced Motion

Respect:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

# 29. Responsive Design

The design should not be a desktop page squeezed onto mobile.

## Breakpoints

```css
--bp-sm: 640px;
--bp-md: 768px;
--bp-lg: 1024px;
--bp-xl: 1280px;
--bp-2xl: 1536px;
```

## Mobile rules

At `<768px`:

- page padding: 16px
- card padding: 18–20px
- display headings shrink aggressively
- grids become one column
- navigation simplifies
- decorative elements reduce
- sticky actions respect safe areas
- touch targets remain ≥44px
- horizontal layouts stack
- giant hero typography becomes 48–64px where appropriate

## Tablet

At 768–1024px:

- use 2-column layouts
- reduce hero display type
- maintain strong card hierarchy
- avoid 4-column dense grids

## Desktop

At ≥1024px:

- 12-column grid
- asymmetric compositions
- larger hero type
- floating decorative objects
- expanded navigation

---

# 30. Mobile Bottom Navigation

If used:

```css
height: 68px;
border-top: 2px solid #111;
background: #FFFDF7;
```

Add safe-area support:

```css
padding-bottom: env(safe-area-inset-bottom);
```

The navigation must not obscure page content.

---

# 31. Accessibility

Neo-brutalism must remain accessible.

## Contrast

Target WCAG AA.

Do not assume bright yellow text is readable.

Bad:

```text
yellow background + white text
```

Good:

```text
yellow background + black text
```

## Focus

Every interactive element must have a visible focus state.

Recommended:

```css
outline: 3px solid #8E7CFF;
outline-offset: 3px;
```

## Keyboard

All controls must be:

- reachable
- logically ordered
- visibly focused
- operable without mouse

## Touch

Minimum:

```text
44 × 44px
```

Preferred:

```text
48 × 48px
```

## Screen readers

Decorative graphics:

```html
aria-hidden="true"
```

Meaningful icons:

- accessible label
- tooltip is not the only label

---

# 32. Shadows and Contrast Accessibility

Hard black shadows create excellent visual separation but can become visually noisy.

Use larger shadows only for:

- featured content
- primary actions
- hero elements

Use smaller shadows for:

- utility controls
- dense lists
- secondary cards

---

# 33. Z-Index System

Centralize z-index.

```css
--z-base: 0;
--z-card: 10;
--z-sticker: 20;
--z-dropdown: 100;
--z-sticky: 200;
--z-modal: 500;
--z-toast: 600;
--z-tooltip: 700;
```

Do not create random `z-index: 9999` values.

---

# 34. Image Treatment

Images should feel integrated into the brutalist system.

Recommended:

```css
img {
  border: 2px solid #111111;
}
```

For image cards:

- 2px black outline
- 8–12px radius
- optional hard shadow
- no default soft shadow

Use image crops intentionally:

- 4:3 for content cards
- 16:9 for feature sections
- 1:1 for avatars / compact tiles
- full-bleed for editorial hero sections

---

# 35. Avatar System

Avatars:

- circular
- 2px black outline
- optionally offset-stacked
- 32–48px standard sizes

Example:

```text
   ◯ ◯ ◯
```

Stacked avatars can overlap by 8–10px.

---

# 36. Search

Search is a high-value control and should feel like a physical object.

```text
┌───────────────────────────────────────────────────┐
│ 🔍  WHERE DO YOU WANT TO GO?                 ⌕   │
└───────────────────────────────────────────────────┘
       █████████████████████████████████████████
```

Suggested:

- 56–64px height for hero search
- 48px standard
- 2–3px border
- yellow/cream/white background
- large readable placeholder
- visible submit button

Search suggestions should use bordered mini-cards.

---

# 37. Tabs

Tabs should look like labels attached to a physical board.

```text
┌──────────┐ ┌──────────┐ ┌──────────┐
│ OVERVIEW │ │ ITINERARY│ │ SAVED    │
└──────────┘ └──────────┘ └──────────┘
```

Active tab:

- yellow or black fill
- high contrast
- black border

Inactive:

- transparent / white
- black border

---

# 38. Progress Indicators

Avoid thin minimal progress bars.

Preferred:

```text
STEP 2 OF 4

[██████████████░░░░░░]

DESTINATION → STAY → ACTIVITIES → REVIEW
```

The bar can use:

- black track
- yellow progress
- 2px outline

---

# 39. Tooltips

Tooltips are secondary.

Style:

```text
background: #111111;
color: #FFFFFF;
border: 2px solid #111111;
box-shadow: 3px 3px 0 #F7E84F;
```

Use tooltips for icon-only controls.

Do not use them for essential information.

---

# 40. Data Visualization

If the application has charts:

- black axes
- thick data strokes
- accent fills
- minimal grid lines
- direct labels where possible
- no default corporate blue chart palette

Example palette:

```text
Primary series: #111111
Secondary: #8E7CFF
Positive: #65D69A
Attention: #FFB15C
Highlight: #F7E84F
```

Charts should look native to the product rather than imported from a BI dashboard.

---

# 41. Backgrounds

Default page background:

```css
background: #FFFDF7;
```

Alternative:

```css
background: #F6F0E5;
```

Use pure white for cards.

### Optional pattern

A very subtle dot/grid pattern may be used on a hero or empty background.

Keep it extremely subtle:

```text
• • • • • • •
• • • • • • •
• • • • • • •
```

Never let the background compete with content.

---

# 42. Decorative Grid / Doodles

Optional visual layer:

- tiny stars
- arrows
- circles
- underlines
- scribbles
- corner labels

Implementation should preferably use SVG/CSS rather than raster images for simple shapes.

Keep decoration `aria-hidden`.

---

# 43. Page Composition

A typical application screen:

```text
┌──────────────────────────────────────────────────────────┐
│ NAVIGATION                                               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│        SMALL EYEBROW                                     │
│                                                          │
│        BIG PRODUCT                                       │
│        STATEMENT                                         │
│                                                          │
│        supporting copy                  STICKER          │
│                                                          │
│        [ PRIMARY CTA ]                                   │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ FEATURED / MAIN WORKFLOW                                 │
│                                                          │
│ ┌───────────────────┐  ┌──────────────────────────────┐  │
│ │ CARD              │  │ CARD                         │  │
│ └───────────────────┘  └──────────────────────────────┘  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ SUPPORTING CONTENT                                       │
└──────────────────────────────────────────────────────────┘
```

---

# 44. Hero Design

Hero should have:

1. eyebrow
2. oversized heading
3. concise value statement
4. primary CTA
5. secondary action if necessary
6. one visual anchor
7. optional decorative sticker

Do not place 6 buttons in the hero.

### Hero headline formula

```text
[VERB]
[OUTCOME]
[MEMORABLE PHRASE]
```

Example:

```text
PLAN
LESS.
TRAVEL
BETTER.
```

---

# 45. Editorial Layout

For high-impact sections, use magazine-like compositions.

Example:

```text
┌─────────────────────────────────────────────┐
│ 01                                          │
│                                             │
│ PLAN YOUR                                   │
│ NEXT                                        │
│ ADVENTURE.                    [STICKER]     │
│                                             │
│                       ┌───────────────────┐ │
│                       │ IMAGE             │ │
│                       └───────────────────┘ │
└─────────────────────────────────────────────┘
```

Use large empty space deliberately.

---

# 46. Dense Dashboard Layout

When displaying lots of information:

- reduce decorative objects
- reduce border thickness to 2px
- use smaller cards
- use consistent grid alignment
- reserve bright colors for statuses and important numbers

Example:

```text
┌───────────┬───────────┬───────────┬───────────┐
│ 12        │ AED 4.2K  │ 8         │ 94%       │
│ TRIPS     │ SPEND     │ SAVED     │ MATCH      │
└───────────┴───────────┴───────────┴───────────┘
```

---

# 47. Component Density

Use three density modes.

## Compact

For:

- tables
- admin views
- lists
- mobile utility areas

## Comfortable

Default application mode.

## Spacious

For:

- landing pages
- onboarding
- hero sections
- major storytelling screens

Do not mix density modes randomly within one component family.

---

# 48. Design Token Reference

```css
:root {
  /* Colors */
  --color-black: #111111;
  --color-white: #FFFFFF;
  --color-paper: #FFFDF7;
  --color-cream: #F6F0E5;

  --color-yellow: #F7E84F;
  --color-pink: #F5B7D2;
  --color-lavender: #CFC7F4;
  --color-purple: #8E7CFF;
  --color-mint: #AEE8C5;
  --color-mint-strong: #65D69A;
  --color-coral: #FF8D72;
  --color-orange: #FFB15C;
  --color-blue: #9BB9FF;

  /* Typography */
  --font-display: 800;
  --font-heading: 750;
  --font-semibold: 650;
  --font-medium: 550;
  --font-regular: 400;

  /* Borders */
  --border-default: 2px;
  --border-heavy: 3px;

  /* Radius */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;

  /* Shadows */
  --shadow-xs: 2px 2px 0 #111111;
  --shadow-sm: 3px 3px 0 #111111;
  --shadow-md: 5px 5px 0 #111111;
  --shadow-lg: 8px 8px 0 #111111;
  --shadow-xl: 12px 12px 0 #111111;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;

  /* Motion */
  --duration-fast: 100ms;
  --duration-standard: 160ms;
  --duration-slow: 240ms;
  --ease-standard: cubic-bezier(.2,.8,.2,1);

  /* Layout */
  --container-max: 1440px;
}
```

---

# 49. Tailwind Mapping

If Tailwind is used, extend the theme rather than scattering arbitrary values.

Example:

```ts
theme: {
  extend: {
    colors: {
      ink: "#111111",
      paper: "#FFFDF7",
      cream: "#F6F0E5",
      neoYellow: "#F7E84F",
      neoPink: "#F5B7D2",
      neoLavender: "#CFC7F4",
      neoPurple: "#8E7CFF",
      neoMint: "#AEE8C5",
      neoCoral: "#FF8D72",
      neoOrange: "#FFB15C",
      neoBlue: "#9BB9FF",
    },
    boxShadow: {
      "neo-xs": "2px 2px 0 #111111",
      "neo-sm": "3px 3px 0 #111111",
      "neo-md": "5px 5px 0 #111111",
      "neo-lg": "8px 8px 0 #111111",
      "neo-xl": "12px 12px 0 #111111",
    },
    borderWidth: {
      "neo": "2px",
      "neo-heavy": "3px",
    },
    borderRadius: {
      "neo": "10px",
      "neo-lg": "14px",
    }
  }
}
```

Preferred utility pattern:

```tsx
className="
  border-neo border-ink
  bg-neoYellow
  rounded-neo
  shadow-neo-md
  transition-[transform,box-shadow]
  duration-150
  hover:translate-x-[2px]
  hover:translate-y-[2px]
  hover:shadow-neo-sm
  active:translate-x-[5px]
  active:translate-y-[5px]
  active:shadow-none
"
```

---

# 50. React Component Architecture

Create reusable primitives.

Suggested structure:

```text
components/
├── ui/
│   ├── button.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── dialog.tsx
│   ├── tabs.tsx
│   ├── tooltip.tsx
│   ├── toast.tsx
│   ├── progress.tsx
│   └── separator.tsx
│
├── neo/
│   ├── NeoButton.tsx
│   ├── NeoCard.tsx
│   ├── NeoSticker.tsx
│   ├── NeoSection.tsx
│   ├── NeoMetric.tsx
│   ├── NeoLabel.tsx
│   └── NeoIllustration.tsx
│
└── layout/
    ├── Navbar.tsx
    ├── MobileNav.tsx
    ├── PageShell.tsx
    ├── Container.tsx
    └── Section.tsx
```

The exact folder structure can change, but the principle cannot:

**Do not rebuild the visual system separately on every page.**

---

# 51. Component API Philosophy

Components should expose semantic variants.

Example:

```tsx
<Button variant="primary" size="lg">
  Start Planning
</Button>
```

Not:

```tsx
<button className="bg-[#F7E84F] border-[3px] shadow-[7px_7px_0_#111] ...">
```

in every file.

Suggested variants:

```text
Button:
- primary
- secondary
- ghost
- destructive
- icon

Card:
- default
- yellow
- pink
- lavender
- mint
- coral
- featured

Badge:
- default
- success
- warning
- info
- accent
```

---

# 52. State Matrix

Every interactive component must define:

| State | Required |
|---|---|
| Default | Yes |
| Hover | Yes |
| Active/pressed | Yes |
| Focus-visible | Yes |
| Disabled | Yes |
| Loading | If async |
| Error | If applicable |
| Selected | If selectable |

Do not ship a button with only a default state.

---

# 53. Button State Specification

```text
DEFAULT
background = yellow
border = 2px black
shadow = 4px 4px black
transform = 0

HOVER
background = slightly brighter yellow
shadow = 2px 2px black
transform = +2px,+2px

ACTIVE
shadow = 0
transform = +4px,+4px

FOCUS
outline = 3px purple
outline-offset = 3px

DISABLED
opacity = .5
shadow = 2px 2px black
transform = none
```

---

# 54. Card State Specification

```text
DEFAULT
shadow = 5px 5px

HOVER
shadow = 7px 7px
transform = -2px,-2px

ACTIVE
shadow = 2px 2px
transform = 2px,2px

FOCUS
outline = 3px purple
```

---

# 55. Hover Rules

Hover should create **physical feedback**, not visual noise.

Good:

```text
translate
shadow change
background shift
underline
```

Avoid:

```text
scale 1.1
blur
glow
huge color transitions
3D perspective
```

### Hover hierarchy

Primary controls:

> physical movement

Cards:

> lift

Links:

> underline/highlight

Images:

> slight crop/position change

Decorative stickers:

> optional small rotation

---

# 56. Interaction with Shadows

The shadow should behave like a physical object.

### Concept

```text
REST:
OBJECT
████ shadow

HOVER:
  OBJECT
████ shadow

PRESS:
    OBJECT
████
```

This creates a consistent tactile vocabulary across the entire application.

---

# 57. Forms — Full Example

```text
TRIP NAME
┌─────────────────────────────────────────────┐
│ Summer in Japan                             │
└─────────────────────────────────────────────┘

DESTINATION
┌─────────────────────────────────────────────┐
│ Tokyo, Japan                              ▼ │
└─────────────────────────────────────────────┘

DATES
┌──────────────────────┐  ┌──────────────────┐
│ 12 AUG               │  │ 20 AUG           │
└──────────────────────┘  └──────────────────┘

TRAVEL STYLE
┌──────────┐ ┌──────────┐ ┌────────────┐
│ RELAXED  │ │ BALANCED │ │ ADVENTURE  │
└──────────┘ └──────────┘ └────────────┘

                         [ BUILD ITINERARY ]
```

---

# 58. Content Design

Visual design is only half the system.

Use:

- short headings
- concrete labels
- action-oriented CTA copy
- human language
- useful microcopy

Prefer:

```text
BUILD MY ITINERARY
```

over:

```text
SUBMIT
```

Prefer:

```text
ADD ANOTHER DAY
```

over:

```text
+ Add
```

---

# 59. AI UI Pattern

If the product uses AI, the AI should feel like a **co-pilot**, not a generic chatbot.

Recommended:

```text
┌──────────────────────────────────────────────────────┐
│ ✦ YOUR AI PLANNER                                    │
│                                                      │
│ Tell me what you want. I'll build the first draft. │
│                                                      │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 7 days in Japan, food + culture, moderate budget │ │
│ └──────────────────────────────────────────────────┘ │
│                                      [ BUILD PLAN ]  │
└──────────────────────────────────────────────────────┘
```

AI-generated output should appear as structured UI, not just a wall of text.

---

# 60. Chat Interface

If the product includes chat:

### User message

- black background
- white text
- black border
- hard shadow optional for major messages

### AI message

- white / cream background
- black border
- structured content inside

Example:

```text
┌──────────────────────────────────────────┐
│ ✦ AI PLANNER                             │
│                                          │
│ I found 3 strong options for your trip. │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ TOKYO • 3 DAYS                       │ │
│ │ FOOD • CULTURE • SHOPPING            │ │
│ │ [ VIEW PLAN ]                        │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

---

# 61. Structured AI Results

Whenever an API returns real data, render it as UI.

Do not dump raw JSON into the interface.

Convert:

```json
{
  "name": "...",
  "price": "...",
  "rating": "...",
  "location": "..."
}
```

into:

```text
┌──────────────────────────────────────┐
│ IMAGE                                │
│                                      │
│ HOTEL NAME                           │
│ ★ 4.7     LOCATION                   │
│                                      │
│ AED 620 / NIGHT                      │
│                                      │
│ [ VIEW ]            [ ADD TO PLAN ]  │
└──────────────────────────────────────┘
```

---

# 62. API Result Cards

Every external result card should have:

1. image / visual anchor
2. title
3. location/category
4. useful metadata
5. price/value if applicable
6. source/availability status
7. primary action
8. secondary action where needed

Avoid overly dense cards.

---

# 63. Itinerary / Timeline

For a travel or planning product, use a brutalist timeline.

```text
DAY 01 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌──────────────────────────────────────────┐
│ 09:00  BREAKFAST                         │
│        Local cafe                        │
└──────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ 11:00  TEMPLE VISIT                      │
│        90 min                             │
└──────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ 14:00  LUNCH                             │
└──────────────────────────────────────────┘
```

Use accent blocks to distinguish days.

---

# 64. Drag-and-Drop / Reordering

If the application supports itinerary editing:

### Rest

Card behaves normally.

### Dragging

- increase shadow
- slight rotation: max ±1deg
- opacity: 0.96
- cursor grabbing

### Drop target

Use:

- lavender background
- black outline
- visible insertion indicator

Never make the drop location ambiguous.

---

# 65. Skeleton-to-Content Transition

Avoid layout jumps.

Reserve:

- image dimensions
- card height
- headline area

When content arrives:

```text
SKELETON → CONTENT
```

Use 100–200ms opacity transition if appropriate.

---

# 66. Responsive Card Grids

Desktop:

```text
┌──────────┐ ┌──────────┐ ┌──────────┐
│ CARD     │ │ CARD     │ │ CARD     │
└──────────┘ └──────────┘ └──────────┘
```

Tablet:

```text
┌──────────────┐ ┌──────────────┐
│ CARD         │ │ CARD         │
└──────────────┘ └──────────────┘
```

Mobile:

```text
┌────────────────────────────┐
│ CARD                       │
└────────────────────────────┘

┌────────────────────────────┐
│ CARD                       │
└────────────────────────────┘
```

Do not force tiny cards on mobile.

---

# 67. Desktop vs Mobile Decorative Density

Desktop:

- full sticker system
- decorative doodles
- asymmetric composition
- larger shadows

Mobile:

- remove approximately 30–60% of non-essential decoration
- reduce rotations
- reduce giant shadows
- maintain strong borders
- keep brand personality through color/type

---

# 68. Scroll Behavior

Use normal document flow.

Avoid:

- scroll-jacking
- horizontal scroll unless intentional
- excessive sticky panels
- full-screen snap sections unless the experience specifically requires it

Sticky elements should have a clear utility.

---

# 69. Sticky Controls

A sticky CTA can be useful for long workflows.

Example mobile:

```text
┌─────────────────────────────────────────┐
│ [ SAVE ]              [ CONTINUE → ]    │
└─────────────────────────────────────────┘
```

Use:

- cream/white background
- top border: 2px black
- safe-area inset
- strong primary action

---

# 70. Page Transitions

When changing major routes:

- preserve navigation position
- avoid blank flashes
- maintain skeleton layout
- use short fade/slide only when helpful

The design should feel fast.

---

# 71. Performance Rules

Neo-brutalism is visually rich but should remain performant.

Prefer:

- CSS shadows
- SVG icons
- CSS shapes
- optimized images
- lazy loading below the fold
- small decorative SVGs

Avoid:

- giant PNG decorations
- multiple video backgrounds
- heavy animation libraries for tiny interactions
- blur filters
- dozens of animated DOM elements

---

# 72. Image Optimization

Use:

- modern image formats
- responsive sizes
- explicit dimensions
- lazy loading below fold

Hero imagery can load eagerly if it is immediately visible.

---

# 73. Dark Mode

Dark mode is **not required unless product requirements demand it**.

If implemented, do not simply invert colors.

Suggested:

```css
--dark-bg: #151515;
--dark-surface: #222222;
--dark-paper: #F6F0E5;

--dark-text: #FFFFFF;
--dark-border: #FFFFFF;
```

Bright accents remain useful.

However, because the supplied visual reference strongly emphasizes white/cream surfaces and black outlines, **light mode should remain the canonical brand mode**.

---

# 74. Brand Consistency Rules

The following should remain stable across every screen:

1. black structural borders
2. hard shadows
3. high-weight typography
4. warm neutral background
5. controlled accent palette
6. physical hover/press behavior
7. consistent corner radius
8. consistent button geometry
9. consistent spacing grid
10. visible hierarchy

---

# 75. Screen-Level Composition Rules

Before building any screen, define:

```text
1. Primary user goal
2. Primary visual anchor
3. Primary CTA
4. Secondary action
5. Supporting information
6. Accent color
7. Decorative layer
```

Example:

```text
Goal:
Create itinerary

Anchor:
Large "BUILD YOUR TRIP" headline

Primary CTA:
BUILD ITINERARY

Accent:
Yellow

Secondary:
Saved plans

Decoration:
AI sticker
```

---

# 76. Visual Hierarchy Formula

For each screen:

```text
HERO / PRIMARY ACTION
        ↓
PRIMARY CONTENT
        ↓
SECONDARY CONTENT
        ↓
UTILITY
```

If everything looks equally important, the design has failed.

---

# 77. Color Hierarchy Formula

```text
BLACK
↓
PRIMARY STRUCTURE

YELLOW
↓
PRIMARY ACTION

PINK / LAVENDER
↓
SECONDARY EMPHASIS

MINT
↓
SUCCESS

CORAL / ORANGE
↓
WARNING / DESTRUCTIVE

BLUE
↓
INFORMATION
```

---

# 78. Component Naming

Prefer semantic names:

```tsx
<PrimaryButton />
<TripCard />
<ItineraryCard />
<StatusBadge />
<SectionHeading />
<AiPlanner />
```

Avoid:

```tsx
<YellowBox />
<PinkCard2 />
<BigThing />
<RandomContainer />
```

Colors are implementation details, not component meaning.

---

# 79. CSS Anti-Patterns

Never create hundreds of unique styles such as:

```css
.card1 {}
.card2 {}
.card3 {}
.yellowCardSpecial {}
.yellowCardSpecial2 {}
```

Instead:

```tsx
<Card variant="yellow" />
<Card variant="lavender" />
<Card variant="featured" />
```

---

# 80. Design QA Checklist

Before calling a screen complete:

### Layout

- [ ] Main content aligns to grid
- [ ] Page max width is respected
- [ ] Spacing uses token values
- [ ] Mobile layout is intentionally designed
- [ ] No accidental overflow

### Typography

- [ ] Correct font family
- [ ] Correct weight
- [ ] Heading hierarchy is obvious
- [ ] No excessive text sizes
- [ ] Line lengths are readable

### Color

- [ ] Accent color has a purpose
- [ ] Text contrast passes accessibility expectations
- [ ] No unnecessary gradients
- [ ] No random colors
- [ ] Primary CTA is visually obvious

### Components

- [ ] Borders are visible
- [ ] Shadows are hard, not blurred
- [ ] Button states exist
- [ ] Cards have consistent geometry
- [ ] Inputs have clear focus states

### Interaction

- [ ] Hover state
- [ ] Active state
- [ ] Focus state
- [ ] Disabled state
- [ ] Loading state where necessary
- [ ] Error state where necessary

### Accessibility

- [ ] Keyboard navigation works
- [ ] Focus is visible
- [ ] Touch targets ≥44px
- [ ] Decorative images are hidden from screen readers
- [ ] Meaningful icons have accessible labels

---

# 81. Visual QA Checklist for the Agent

When the implementation is visually reviewed, ask:

### Question 1

**Does it immediately look like the same design system?**

If not, fix:

- typography
- borders
- shadows
- color
- spacing

### Question 2

**Does the interface feel physical?**

If not, improve:

- hard shadows
- button press
- card hover
- tactile controls

### Question 3

**Is the page too colorful?**

If yes:

- remove unnecessary accents
- return to cream/white/black
- use one dominant accent

### Question 4

**Is the interface too generic?**

If yes:

- increase type scale
- introduce editorial composition
- use stickers
- increase border weight
- add asymmetric composition

### Question 5

**Is it too chaotic?**

If yes:

- restore grid
- remove decorative elements
- reduce color count
- standardize spacing
- simplify hierarchy

---

# 82. Do / Don't Reference

## DO

```text
✓ 2px black borders
✓ 4–8px hard shadows
✓ cream backgrounds
✓ yellow primary CTA
✓ bold typography
✓ editorial composition
✓ physical interaction
✓ strong cards
✓ controlled stickers
✓ accessible focus
✓ intentional asymmetry
```

## DON'T

```text
✗ glassmorphism
✗ blur shadows
✗ subtle gray borders everywhere
✗ excessive gradients
✗ tiny text
✗ huge rounded pills
✗ random rotations
✗ five competing CTAs
✗ color without meaning
✗ inaccessible contrast
✗ generic SaaS dashboard styling
```

---

# 83. Example Complete Card

```tsx
<Card variant="yellow" className="relative overflow-visible">
  <Badge className="absolute -top-3 left-5 rotate-[-2deg]">
    ✦ RECOMMENDED
  </Badge>

  <div className="flex items-start justify-between gap-4">
    <div>
      <p className="text-xs font-bold uppercase tracking-wider">
        3 DAYS • TOKYO
      </p>

      <h3 className="mt-3 text-3xl font-black tracking-[-0.035em]">
        Food, culture & late nights.
      </h3>

      <p className="mt-3 max-w-md text-sm leading-6">
        A balanced itinerary with neighborhoods, local food and
        enough free time to explore.
      </p>
    </div>

    <IconButton aria-label="Save itinerary">
      <Heart />
    </IconButton>
  </div>

  <div className="mt-6 flex flex-wrap gap-2">
    <Badge>FOOD</Badge>
    <Badge>CULTURE</Badge>
    <Badge>WALKABLE</Badge>
  </div>

  <div className="mt-7 flex items-center justify-between gap-4">
    <div>
      <p className="font-mono text-xs uppercase">EST. COST</p>
      <p className="text-2xl font-black">AED 1,850</p>
    </div>

    <Button variant="primary">
      VIEW PLAN →
    </Button>
  </div>
</Card>
```

---

# 84. Example Page Token Application

A page should feel approximately like:

```text
BACKGROUND
#FFFDF7

PRIMARY TEXT
#111111

MAIN CTA
#F7E84F

SECONDARY BLOCK
#CFC7F4

SUCCESS
#AEE8C5

WARNING
#FFB15C

BORDER
2px #111111

CARD SHADOW
5px 5px 0 #111111

HERO SHADOW
8px 8px 0 #111111

CARD RADIUS
12px

BUTTON RADIUS
9px
```

---

# 85. Agent Implementation Rules

The coding agent must treat this document as a **design contract**.

## Rule 1

Do not invent a new visual language for individual pages.

## Rule 2

If a new component is needed, first compose it from existing tokens.

## Rule 3

If a new token is genuinely required, add it to the centralized design system instead of hardcoding it locally.

## Rule 4

Every interactive component must have:

- default
- hover
- active
- focus-visible
- disabled

where applicable.

## Rule 5

Do not use arbitrary shadows.

Allowed:

```text
2px 2px 0 #111
3px 3px 0 #111
5px 5px 0 #111
8px 8px 0 #111
12px 12px 0 #111
```

Custom values are allowed only when visually justified.

## Rule 6

Do not use arbitrary colors.

Use semantic tokens.

## Rule 7

Do not introduce gradients unless explicitly required by a product illustration.

## Rule 8

Do not use blur-based UI effects.

## Rule 9

Do not sacrifice mobile usability for visual experimentation.

## Rule 10

When uncertain, choose:

**more contrast + simpler structure + stronger hierarchy.**

---

# 86. Recommended Default Component Tokens

```text
BUTTON
border: 2px
radius: 9px
shadow: 4px
height: 48px

CARD
border: 2px
radius: 12px
shadow: 5px
padding: 24px

INPUT
border: 2px
radius: 8px
height: 48px

BADGE
border: 2px
radius: 6px
shadow: 2px
height: 28px

MODAL
border: 3px
radius: 14px
shadow: 10px

ICON BUTTON
border: 2px
radius: 8px
shadow: 3px
size: 44–48px
```

---

# 87. Visual Priority Levels

Every component should be assigned a priority.

### P0 — Primary

Examples:

- Build itinerary
- Book
- Continue
- Confirm

Visual:

- accent background
- heavy border
- hard shadow
- strongest type

### P1 — Secondary

Examples:

- Save
- View details
- Edit

Visual:

- white/lavender/pink
- black border
- medium shadow

### P2 — Utility

Examples:

- filter
- sort
- close
- more

Visual:

- white
- 2px border
- small shadow

### P3 — Decorative

Examples:

- stars
- stickers
- doodles

Visual:

- may rotate
- may overlap
- never interfere with controls

---

# 88. The "Neo Brutalist Balance" Test

Before shipping, evaluate the screen across five dimensions:

```text
BRUTALISM
████████░░ 80%

PLAYFULNESS
███████░░░ 70%

CLARITY
█████████░ 90%

ACCESSIBILITY
█████████░ 90%

DECORATION
████░░░░░░ 40%
```

The exact numbers are not literal metrics. They represent the intended balance:

**Strong brutalism + high clarity + moderate playfulness + restrained decoration.**

---

# 89. Final Design Philosophy

The application should look as if every interface object was deliberately designed and physically placed.

The user should be able to recognize the system from:

- the black outlines
- the hard shadows
- the oversized type
- the warm paper background
- the yellow CTA
- the colorful cards
- the physical hover states
- the editorial compositions
- the playful labels

But underneath the personality, the product should remain extremely conventional in the ways that matter:

- predictable navigation
- readable content
- accessible controls
- responsive layouts
- fast interactions
- clear errors
- obvious actions

### The final mental model

```text
                    BRAND
                      │
          ┌───────────┴───────────┐
          │                       │
       VISUAL                  UX
          │                       │
    ┌─────┼─────┐           ┌────┼────┐
    │     │     │           │    │    │
  TYPE  COLOR SHADOW       FLOW CLARITY ACCESS
    │     │     │           │    │    │
    └─────┼─────┘           └────┼────┘
          │                       │
          └───────────┬───────────┘
                      │
                PRODUCT FEEL
                      │
              "DIGITAL OBJECT"
```

**Build the UI as a system, not a collection of screens.**

If a component looks good but breaks the system, it is not good enough.

If a component is simple but perfectly follows the system, it is valuable.

**Consistency creates the visual identity. Expression creates the memorability. Usability makes it a product.**
