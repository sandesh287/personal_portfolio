---
name: Monolithic Engineer
colors:
  surface: '#f9f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f9f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f5'
  surface-container: '#eeeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e4'
  on-surface: '#1a1c1d'
  on-surface-variant: '#414755'
  inverse-surface: '#2f3132'
  inverse-on-surface: '#f0f0f2'
  outline: '#717786'
  outline-variant: '#c1c6d7'
  surface-tint: '#005bc1'
  primary: '#0058bc'
  on-primary: '#ffffff'
  primary-container: '#0070eb'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#9e3d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c64f00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004493'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb595'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7c2e00'
  background: '#f9f9fb'
  on-background: '#1a1c1d'
  surface-variant: '#e2e2e4'
typography:
  display:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  h1:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  h2:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  code:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '450'
    lineHeight: 20px
  label-caps:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  sidebar-width: 260px
  container-max: 1200px
---

## Brand & Style

This design system is built for high-performance productivity and professional technical showcase. It draws inspiration from modern engineering tools like VS Code and Linear, prioritizing structural clarity over decorative flair.

The design style is **Minimalist-Functional**. It utilizes a "Desktop-Native" aesthetic characterized by high-density layouts, clear visual hierarchies, and a restrained monochrome palette. Instead of relying on depth through shadows or blur, it uses "Ghost Borders"—thin, low-contrast outlines that define functional zones without adding visual noise. The goal is to evoke an atmosphere of precision, reliability, and extreme organization.

## Colors

The palette is strictly monochromatic to ensure that the user's projects and code remain the focal point. 

- **Primary**: A single, vibrant "Electric Blue" (#007AFF) used sparingly for calls to action, active states, and focus indicators.
- **Surface**: Pure white (#FFFFFF) for primary content areas, with a subtle off-white (#F5F5F7) for sidebars and background layers to create a "nested window" effect.
- **Ink**: Deep blacks and varied grays are used to establish hierarchy in text.
- **Borders**: All elements are defined by a 1px solid border (#E5E5E5). Avoid using shadows to separate elements; use border-driven containment.

## Typography

The system uses **Geist** for all UI and prose, taking advantage of its technical, geometric precision. **JetBrains Mono** is introduced as a secondary functional font for code snippets, metadata, and technical labels to reinforce the engineer-centric persona.

- **Scale**: Use `body-md` (15px) as the standard for desktop interfaces to balance information density and readability.
- **Emphasis**: Use font-weight rather than color for emphasis. Headers should be semi-bold or bold to stand out against the sparse background.
- **Tracking**: Use slight negative letter-spacing on display headings to mimic the tight, professional feel of modern SaaS applications.

## Layout & Spacing

This design system follows a **Modular Sidebar Layout** model, similar to IDEs or modern productivity apps.

- **Grid**: A 12-column fluid grid for the main stage, with a fixed-width left sidebar (260px).
- **Rhythm**: All spacing is based on a 4px baseline. Use 16px (md) for standard internal padding and 24px (lg) for section gaps.
- **Margins**: Use generous external margins (40px+) to frame the "operating system" window, making the portfolio feel like a self-contained application floating on the screen.
- **Density**: Maintain high density in sidebars (using `body-sm`) and relaxed density in the main content area (using `body-lg` or `body-md`).

## Elevation & Depth

Depth is achieved through **Surface Layering** and **Subtle Shadows** rather than traditional elevation.

- **Level 0**: The background/wallpaper of the "OS".
- **Level 1**: The main application window with a 1px border.
- **Level 2**: Sidebars and navigation panels, distinguished by a slightly darker background hex (#F5F5F7).
- **Shadows**: Use a single, highly diffused "Ambient Shadow" for the primary window container (0px 20px 50px rgba(0,0,0,0.08)). All internal components (buttons, cards) should be flat with borders.
- **Interactions**: On hover, elements should not "lift" with shadows. Instead, use subtle background color shifts (e.g., from white to #FAFAFA).

## Shapes

The shape language is "Soft-Modular." 

- **Windows & Main Containers**: Use `rounded-xl` (24px) for the outermost application frame to give it a modern, friendly desktop feel.
- **UI Components**: Buttons, inputs, and internal cards use `rounded-lg` (12px-16px).
- **Small Elements**: Tags, checkboxes, and icons use `rounded-sm` (4px) to maintain a crisp, technical edge.

## Components

- **Buttons**:
  - *Primary*: Solid #007AFF, white text, 12px corner radius. No gradient.
  - *Secondary*: White background, 1px #E5E5E5 border, dark text.
- **Input Fields**: 1px #E5E5E5 border with a 4px focus ring in #007AFF at 20% opacity. Use JetBrains Mono for text entry to emphasize the "developer" feel.
- **Cards**: Flat white background, 1px solid border, no shadow. Content should have 24px internal padding.
- **Side Navigation**: Icons (20px) followed by `body-sm` text. Active states are indicated by a 2px vertical blue line on the far left or a subtle gray background pill.
- **Status Pills**: Small, capital-case labels with a light gray background and a 2px colored dot (e.g., Green for "Active", Blue for "In Progress").
- **Code Blocks**: Dark mode containers (#1A1A1A) even in light mode layouts, providing a high-contrast focal point for the engineer's work.