---
name: PediaBloom
colors:
  surface: '#f5fbef'
  surface-dim: '#d6dcd0'
  surface-bright: '#f5fbef'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f6ea'
  surface-container: '#eaf0e4'
  surface-container-high: '#e4eade'
  surface-container-highest: '#dee4d9'
  on-surface: '#171d16'
  on-surface-variant: '#3f4a3c'
  inverse-surface: '#2c322a'
  inverse-on-surface: '#edf3e7'
  outline: '#6f7a6b'
  outline-variant: '#becab9'
  surface-tint: '#006e1c'
  primary: '#006e1c'
  on-primary: '#ffffff'
  primary-container: '#4caf50'
  on-primary-container: '#003c0b'
  inverse-primary: '#78dc77'
  secondary: '#0061a4'
  on-secondary: '#ffffff'
  secondary-container: '#33a0fd'
  on-secondary-container: '#00355c'
  tertiary: '#8b5000'
  on-tertiary: '#ffffff'
  tertiary-container: '#e18500'
  on-tertiary-container: '#4d2b00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#94f990'
  primary-fixed-dim: '#78dc77'
  on-primary-fixed: '#002204'
  on-primary-fixed-variant: '#005313'
  secondary-fixed: '#d1e4ff'
  secondary-fixed-dim: '#9ecaff'
  on-secondary-fixed: '#001d36'
  on-secondary-fixed-variant: '#00497d'
  tertiary-fixed: '#ffdcbe'
  tertiary-fixed-dim: '#ffb870'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#693c00'
  background: '#f5fbef'
  on-background: '#171d16'
  surface-variant: '#dee4d9'
typography:
  display-id:
    fontFamily: Quicksand
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-en:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: 0em
  headline-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Quicksand
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  body-lg:
    fontFamily: Quicksand
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 30px
  body-md:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  label-sm:
    fontFamily: Quicksand
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  touch-target: 48px
---

## Brand & Style
The design system is centered around a "Premium 3D Storybook" aesthetic, designed to evoke wonder, safety, and curiosity for children aged 4-12. The brand personality is that of a gentle explorer—knowledgeable yet playful. 

The visual style utilizes **Tactile / Skeuomorphic** elements mixed with **Modern Softness**. Every interface element should feel like a physical object a child can touch: buttons should look slightly raised and approachable, and cards should appear like high-quality cardstock. 

**Visual Identity & Mascot:**
- **Mascot Integration:** Bloom, the forest explorer bird, acts as a navigational guide. Bloom should appear in empty states, onboarding, and achievement screens.
- **Motifs:** Use subtle background patterns inspired by Indonesian flora (Monstera leaves, Batik-style cloud swirls) with very low opacity to add texture without distracting from content.
- **Emotional Response:** Friendly, optimistic, and academically inviting.

## Colors
The color palette is vibrant and nature-inspired, balanced against a warm, paper-like background to reduce eye strain during reading.

- **Primary (Leaf Green):** Used for "Success" states, growth tracking, and main navigation.
- **Secondary (Sky Blue):** Used for discovery, science categories, and interactive water elements.
- **Tertiary (Warm Orange):** Used for highlights, playful accents, and creative categories.
- **Hero Red:** Reserved for high-energy interactions or "History" categories.
- **Fresh Teal:** Used for bilingual secondary UI elements and specialized tools.
- **Soft Cream Background:** This is the canvas. Avoid pure white (#FFFFFF) to maintain the "storybook" warmth.
- **Dark Navy Text:** Provides high contrast for readability without the harshness of pure black.

## Typography
The typography system prioritizes legibility for developing readers. **Quicksand** is used across all levels for its rounded terminals and friendly appearance.

**Bilingual Hierarchy:**
Every major heading must follow a dual-language structure:
1. **Primary (Indonesian):** Bold, larger font size, Dark Navy color.
2. **Secondary (English):** Medium weight, 60% the size of the primary text, Fresh Teal color.

**Reading Experience:**
Body text should never go below 18px to ensure ease of reading for younger users. Line height is generous (1.5x) to prevent lines from crowding.

## Layout & Spacing
This design system uses a **Fluid Grid** with exaggerated safe areas to accommodate motor skill development in younger children.

- **Grid:** 12-column for desktop, 4-column for mobile.
- **Margins:** Minimum 24px on mobile to prevent accidental edge-taps.
- **Touch Targets:** All interactive elements must maintain a minimum 48x48px hit area.
- **Vertical Rhythm:** Use the `lg` (40px) spacing between distinct content sections to create a sense of "breathing room" reminiscent of a physical book layout.

### Home Screen Master Layout
The home screen follows the approved Stitch-derived "storybook activity sheet" pattern. This is the master direction for the first screen and should override generic dashboard layouts.

- **Scene Background:** The home route uses a soft illustrated storybook backdrop with low-contrast flora/leaf atmosphere and warm cream/green light. The background should fill the whole viewport and must not leave large empty side gutters on tablet or desktop widths.
- **Main Page Panel:** Primary home content sits inside a frosted, rounded page panel with soft white/cream translucency, subtle border, and ambient shadow. The panel may narrow on phone screens, but should expand up to a wider stage on tablet/desktop.
- **Search First:** Search appears near the top of the panel as a large rounded field with a clear icon and child-readable placeholder. It is the main discovery affordance.
- **Topic Tile Grid:** Topic/category entry points use pastel tactile tiles with icon blocks, rounded corners, and 2-column layout on mobile. On wider viewports the grid may expand to 3 columns while keeping the same Stitch tile language.
- **New User Fallback:** When there is no learning history, the home screen must show a curated "Mulai Jelajah / Start Exploring" section instead of leaving blank space before the bottom navigation.
- **Progress Summary:** Streak, badges, coins, or level stats should be compact, visual, and secondary to discovery. These stats must not turn the first screen into a dense dashboard.
- **Companion Card:** BimoBot or mascot guidance appears as a compact storybook helper card, not as a large marketing banner.

## Elevation & Depth
Depth is created through **Ambient Shadows** and **Tonal Layering**. The system uses "Soft Volume" to imply physical presence.

- **Shadows:** Use medium blur radii (12px-16px) with low opacity (10%). The shadow color should be a darkened tint of the background rather than pure grey.
- **Inner Glows:** Interactive buttons use a subtle top-inner-white-highlight to simulate a slightly convex surface.
- **Active State:** When pressed, elements should "sink" (shadow offset decreases, scale reduces to 0.98), providing tactile feedback.

## Shapes
The shape language is **Rounded** and friendly, moving away from ultra-rounded pill shapes to a more structured but safe aesthetic.

- **Containers:** All cards and modals use `rounded-xl` (1.5rem) to ensure there are no "sharp" corners, reinforcing the safe, child-friendly environment.
- **Icons:** Icons should have thick strokes (2px-3px) and rounded caps.
- **Image Masks:** Photography of animals or nature should be housed in organic, rounded-rect frames rather than perfect circles or sharp rectangles.

## Components

### Buttons
Buttons are the primary "toys" of the UI. 
- **Primary:** Leaf Green with a 3px bottom "border-shadow" of a darker green to create a 3D effect.
- **Label:** White, Bold Quicksand.

### Bottom Navigation
The primary mobile navigation follows the Stitch home pattern: a light, rounded, floating bottom bar with a raised center action. Active icons use Leaf Green or Warm Orange depending on role. The nav must keep 48x48px tap targets, avoid covering required content, and remain legible in dark mode.

### Cards
Cards act as storybook chapters.
- **Style:** Cream-colored surface, `rounded-xl` corners, subtle warm shadow.
- **Header:** Contains the Indonesian title and English subtitle stacked vertically.

### Chips / Tags
Used for categories like "Mammals" or "History."
- **Style:** Lightly tinted background of the category color with a darker border. Uses `rounded-md`.

### Input Fields
Large, friendly fields for searching the encyclopedia.
- **Style:** 2px border in Sky Blue, background in a slightly lighter shade of cream than the main page. Placeholder text should be phrased as a question (e.g., "What do you want to learn?").

### Progress Bars
Used for learning paths.
- **Style:** Thick, 16px height, rounded ends. The "fill" should have a subtle diagonal stripe pattern to indicate movement/growth.

### Modals
Modals should not cover the whole screen; they should appear as "Pop-up Book" elements that slide up from the bottom with a springy animation.
