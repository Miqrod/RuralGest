# Design System Strategy: RuralGest

## 1. Overview & Creative North Star
The "RuralGest" is the Creative North Star for this design system. We are moving away from the "data-heavy spreadsheet" aesthetic common in agriculture and toward a high-end, editorial experience. This system treats livestock management with the same precision and prestige as a luxury timepiece or a premium financial platform.

The design breaks the "standard dashboard" mold through **intentional asymmetry** and **tonal depth**. Rather than a rigid grid of identical boxes, we use varied card widths and "breathing" white space to guide the eye. We favor a "Digital Curator" approach: data isn't just displayed; it is presented as a narrative of herd health and operational efficiency.

## 2. Colors & Surface Philosophy
The palette is rooted in deep, authoritative greens (`primary: #004c22`) and sophisticated slate grays (`secondary: #515f74`), evoking a sense of heritage and biological growth.

*   **The "No-Line" Rule:** To achieve a premium look, designers are prohibited from using 1px solid borders to section off the UI. Separation must be achieved through background shifts. A `surface-container-low` section should sit on a `surface` background to define its bounds.
*   **Surface Hierarchy & Nesting:** Treat the UI as physical layers.
    *   **Base:** `surface` (#fbf8fc)
    *   **Secondary Sections:** `surface-container-low` (#f6f2f7)
    *   **Interactive Cards:** `surface-container-lowest` (#ffffff)
    *   **Overlays/Modals:** `surface-bright` (#fbf8fc)
*   **The "Glass & Gradient" Rule:** Main CTAs or high-level health metrics should use a subtle linear gradient from `primary` (#004c22) to `primary_container` (#166534). For floating navigation or quick-action panels, use glassmorphism: a semi-transparent `surface` color with a `backdrop-blur` of 12px-20px.

## 3. Typography: Authoritative Clarity
We utilize **Inter** to provide a modern, technical edge that balances the organic color palette.

*   **Display (Display-LG/MD):** Used for "Hero" stats (e.g., Total Herd Count). This should feel monumental and undeniable.
*   **Headlines (Headline-SM):** Used for section titles. Pair these with high tracking (letter-spacing) to evoke an editorial magazine feel.
*   **Body (Body-MD):** The workhorse. Reserved for data labels and cow identifiers.
*   **Labels (Label-SM):** Used for metadata (e.g., "Last Vet Check"). Always in semi-bold or medium weight to ensure legibility against tonal backgrounds.

The hierarchy is designed to be "scannable but deep." Large display numbers provide the "at-a-glance" status, while secondary body text provides the nuance.

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often messy. In this system, depth is biological and soft.

*   **The Layering Principle:** Place a `surface-container-lowest` card (Pure White) on a `surface-container` (Soft Gray/Lavender) background. The contrast in value creates a natural "lift" without a single pixel of shadow.
*   **Ambient Shadows:** If an element must float (like a dropdown or "Cow Profile" modal), use a shadow with a 32px blur, 0px offset, and 5% opacity using the `on_surface` color. This creates an ambient glow rather than a harsh drop-shadow.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use the `outline_variant` (#bfc9bd) at **15% opacity**. It should be felt, not seen.
*   **Glassmorphism:** Use `surface_variant` at 70% opacity with a blur for top navigation bars. This allows the lush green "Pastoral" accents of the dashboard to bleed through as the user scrolls.

## 5. Components

### Buttons
*   **Primary:** Solid `primary` (#004c22) with `on_primary` (#ffffff) text. Use `md` (0.75rem) rounding. No border.
*   **Secondary:** `secondary_container` (#d5e3fc) background with `on_secondary_container` text.
*   **Tertiary:** Ghost style. No background, `primary` text. Transitions to a subtle `surface_container_high` on hover.

### Input Fields
*   **Styling:** Forgo the 4-sided box. Use a `surface_container_highest` background with a 2px bottom-bar in `outline`. On focus, the bottom bar transitions to `primary`.

### Cards & Lists
*   **No Dividers:** Prohibit the use of horizontal rules (HRs). Use 24px of vertical padding and subtle background shifts (`surface-container-low` vs `surface-container-high`) to separate individual cow entries or data points.

### Context-Specific Components
*   **The "Health Vitals" Chip:** Use `tertiary_container` for positive health statuses and `error_container` for alerts. These should have `full` (9999px) rounding to contrast against the `md` rounding of the structural cards.
*   **Livestock Timeline:** A vertical track using the `outline_variant` at 20% opacity. Events are marked by `primary` dots that "glow" using a soft ambient shadow.

## 6. Do's and Don'ts

### Do
*   **DO** use whitespace as a functional tool. If a screen feels cluttered, increase the padding between containers rather than adding a border.
*   **DO** use `primary_fixed_dim` for icons. It provides enough contrast without being as harsh as pure black.
*   **DO** nest containers. A high-priority "Alert" card can live inside a `surface_container`, but it should use the `surface_container_lowest` (white) background to "pop."

### Don't
*   **DON'T** use pure black (#000000) for text. Use `on_surface` (#1b1b1e) to maintain a sophisticated, soft-ink look.
*   **DON'T** use "Default" shadows. If you can see the edge of the shadow, it is too dark.
*   **DON'T** use 1px borders to separate list items. Use the spacing scale to create "pockets" of information.
*   **DON'T** use high-saturation greens. Stick to the `primary` (#004c22) forest tones to ensure the "Trustworthy" brand promise.