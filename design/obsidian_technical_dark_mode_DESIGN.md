---
name: Obsidian Technical
colors:
  surface: '#10131b'
  surface-dim: '#10131b'
  surface-bright: '#363942'
  surface-container-lowest: '#0b0e16'
  surface-container-low: '#181c23'
  surface-container: '#1c2028'
  surface-container-high: '#272a32'
  surface-container-highest: '#31353d'
  on-surface: '#e0e2ed'
  on-surface-variant: '#c1c6d7'
  inverse-surface: '#e0e2ed'
  inverse-on-surface: '#2d3039'
  outline: '#8b90a0'
  outline-variant: '#414755'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e69'
  primary-container: '#4b8eff'
  on-primary-container: '#00285c'
  inverse-primary: '#005bc1'
  secondary: '#adc6ff'
  on-secondary: '#082f65'
  secondary-container: '#26467d'
  on-secondary-container: '#98b5f3'
  tertiary: '#ffb595'
  on-tertiary: '#571e00'
  tertiary-container: '#ef6719'
  on-tertiary-container: '#4c1a00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#26467d'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb595'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7c2e00'
  background: '#10131b'
  on-background: '#e0e2ed'
  surface-variant: '#31353d'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base_unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1280px
  gutter: 16px
---

## Brand & Style

The design system is a high-end, developer-centric interface that prioritizes focus, precision, and depth. It draws heavily from **Minimalism** and **Modern Corporate** styles, specifically tailored for technical environments where long-session readability is paramount.

The aesthetic is defined by an "Obsidian" depth model—using dark, non-pure-black surfaces to create a sense of infinite space while maintaining distinct functional zones. The interface should feel like a premium instrument: quiet, responsive, and authoritative. It targets a sophisticated audience that values utility over decoration, utilizing sharp typography and disciplined spacing to organize complex information hierarchies.

## Colors

This design system utilizes a deep, multi-layered dark palette inspired by high-performance IDEs.

- **Backgrounds:** The foundation is `#0d1117` (Obsidian), providing a void-like canvas. Secondary containers use `#161b22` (Deep Charcoal) to create structural separation.
- **Accents:** The primary blue (`#007aff`) is used sparingly for interactive states, progress indicators, and critical focus points. On dark backgrounds, this blue should maintain high saturation to ensure legibility.
- **Typography:** Headlines utilize a high-contrast off-white to ensure "pop" against the dark canvas. Body text is pushed back into a muted silver-gray to reduce eye strain during extended reading.
- **Feedback:** Use semantic colors with adjusted luminosity: Success (Emerald), Warning (Amber), and Error (Coral), all optimized for a dark-mode contrast ratio of at least 4.5:1.

## Typography

The design system exclusively uses **Geist**, a typeface designed specifically for the visual needs of developers and technical writers. 

- **Headlines:** Use Bold and SemiBold weights with tighter letter-spacing to create a "blocky," structural feel.
- **Body:** Standard body text uses the Regular weight. For data-heavy views or secondary metadata, the Medium weight can be used at smaller sizes to maintain legibility.
- **Monospace:** While Geist is a sans-serif, its geometric nature allows it to pair seamlessly with Geist Mono for code snippets or tabular data.
- **Contrast:** Always use the primary text color for headings and secondary text color for body paragraphs to establish a clear information hierarchy.

## Layout & Spacing

This design system follows a strict **8px grid system** for consistent spatial relationships.

- **Layout Model:** A fluid grid with a maximum content width of 1280px. For dashboard layouts, use a fixed left-hand sidebar (240px or 280px) with a fluid main content area.
- **Margins & Gutters:** Desktop uses 24px margins and 16px gutters. Mobile scales down to 16px margins and 12px gutters.
- **Rhythm:** Vertical spacing between sections should follow a 2x scale (e.g., 16px, 32px, 64px) to ensure a rhythmic flow that feels intentional and organized.

## Elevation & Depth

Depth is communicated through **Tonal Layering** and **Low-Contrast Outlines** rather than traditional shadows.

- **Stacking:** 
  - Level 0: `#0d1117` (Main background)
  - Level 1: `#161b22` (Cards, sidebars, header)
  - Level 2: `#21262d` (Modals, popovers, tooltips)
- **Borders:** Every surface transition must be defined by a 1px border (`#30363d`). This "inner stroke" technique replaces shadows to create a crisp, architectural look.
- **Active States:** Subtle inner glows (0.5 opacity white) can be used on interactive elements when hovered to simulate light hitting a physical edge.

## Shapes

The design system uses a consistent **8px (0.5rem)** corner radius for most UI elements, striking a balance between technical precision and modern approachability.

- **Small Components:** Checkboxes and small tags use 4px (Soft).
- **Standard Components:** Buttons, Input fields, and Cards use 8px (Rounded).
- **Large Components:** Modals and large feature banners use 12px or 16px (Rounded-lg).
- **Interactive Indicators:** Focus rings should follow the shape of the parent element with a 2px offset.

## Components

- **Buttons:**
  - *Primary:* Solid `#007aff` with white text. No shadow.
  - *Secondary:* Background `#21262d` with a `#30363d` border. Text in primary off-white.
  - *Ghost:* No background or border. Text in secondary silver, shifting to primary blue on hover.
- **Input Fields:** Use `#0d1117` as the fill to contrast against `#161b22` cards. Border is `#30363d`, turning `#007aff` on focus.
- **Cards:** Background `#161b22` with a 1px border. Do not use shadows; rely on the border and background color shift for separation.
- **Chips/Tags:** Small, low-profile capsules with `#21262d` backgrounds and secondary-colored text. 
- **Lists:** Use subtle horizontal dividers (`#21262d`). Hover states for list items should use a slight background lightening to `#1c2128`.
- **Modals:** Use a heavy backdrop blur (12px) behind the modal to maintain focus on the elevated surface (`#21262d`).