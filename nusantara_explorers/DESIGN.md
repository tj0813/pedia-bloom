---
name: Nusantara Explorers
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf3'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d5e3fc'
  on-surface: '#0d1c2e'
  on-surface-variant: '#3c4a46'
  inverse-surface: '#233144'
  inverse-on-surface: '#eaf1ff'
  outline: '#6b7a76'
  outline-variant: '#bacac5'
  surface-tint: '#006b5f'
  primary: '#006b5f'
  on-primary: '#ffffff'
  primary-container: '#2dd4bf'
  on-primary-container: '#00574d'
  inverse-primary: '#3cddc7'
  secondary: '#944a00'
  on-secondary: '#ffffff'
  secondary-container: '#fd933d'
  on-secondary-container: '#693300'
  tertiary: '#944a23'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffaa81'
  on-tertiary-container: '#7e3913'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#62fae3'
  primary-fixed-dim: '#3cddc7'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#005047'
  secondary-fixed: '#ffdcc5'
  secondary-fixed-dim: '#ffb783'
  on-secondary-fixed: '#301400'
  on-secondary-fixed-variant: '#713700'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb693'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#76330d'
  background: '#f8f9ff'
  on-background: '#0d1c2e'
  surface-variant: '#d5e3fc'
typography:
  headline-xl:
    fontFamily: Quicksand
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Quicksand
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 32px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  label-md:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
  container-max: 1200px
---

## Brand & Style

The design system is centered on the "Nusantara Explorers" narrative, transforming an educational encyclopedia into a digital playground of discovery for Indonesian children. The brand personality is encouraging, curious, and deeply rooted in the diverse beauty of Indonesia. It aims to evoke an emotional response of wonder and safety, making learning feel like an adventurous trek through the archipelago.

The design style is a hybrid of **Minimalism** and **Tactile/Skeuomorphism**. While the layouts remain clean and uncluttered to avoid cognitive overload, individual elements possess a "squishy" physical quality. Large touch targets, soft-focus depth, and bouncy interactions ensure the UI feels responsive and alive, inviting little fingers to tap and explore.

## Colors

The palette is inspired by the natural and cultural landscape of Indonesia. **Nusantara Teal** (Primary) represents the seas and forests, serving as the dominant color for navigation and progress. **Heritage Orange** (Secondary) provides a warm, energetic contrast for interactive highlights. **Earth Brown** (Tertiary) is used sparingly for grounding elements related to history and geography, while **Science Purple** (Accent) is reserved for technological and robotic themes associated with BimoBot.

The background uses a very soft tint of teal (#F0FDFA) instead of pure white to reduce eye strain during long reading sessions. All colors are calibrated to meet AA contrast standards for accessibility while maintaining a vibrant, saturated feel that appeals to a younger demographic.

## Typography

Typography prioritizes legibility and friendliness. **Quicksand** is used for all headings and labels; its rounded terminals match the "soft" brand personality. For long-form educational content, **Plus Jakarta Sans** provides a modern, clear structure that helps children distinguish letters easily.

Font sizes are intentionally scaled up. The base body size starts at 18px to ensure comfortable reading on tablets and handheld devices. Line heights are generous (1.5x - 1.6x) to prevent lines of text from crowding, which is crucial for early readers.

## Layout & Spacing

The design system utilizes a **Fluid Grid** model with high-margin safety zones. For mobile, a 4-column grid is used, expanding to 12 columns on tablets and desktops. 

Spacing follows a strict 8px rhythmic scale. However, "Oxygen Zones" (large areas of whitespace) are prioritized around critical content cards to keep the focus on one topic at a time. Layouts should favor vertical stacking for easy scrolling, with horizontal carousels used specifically for "Misi Hari Ini" (Daily Missions) or browsing related topics.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Ambient Shadows**. Instead of harsh black shadows, this design system uses "Colored Glows"—soft, diffused shadows tinted with the primary or secondary color of the element (e.g., a Teal card casts a soft #2DD4BF shadow).

Depth levels:
- **Level 0 (Floor):** The tinted background.
- **Level 1 (Surface):** White cards containing text and images, featuring a subtle 4px blur shadow.
- **Level 2 (Interactive):** Buttons and active chips, featuring an 8px blur shadow that "shrinks" when pressed to simulate a physical push.

## Shapes

The shape language is extremely organic. Following the "3xl" requirement, almost all containers use a minimum of 24px (1.5rem) corner radius. This removes any "sharpness" from the UI, reinforcing the safe and playful environment. 

Buttons are fully pill-shaped. Image containers should always be clipped with rounded corners, and decorative background blobs should be used to break up the rigidity of the grid.

## Components

### Buttons
Primary buttons use **Heritage Orange** with a "thick" bottom border (4px) in a slightly darker shade to create a 3D effect. On hover/tap, the button should translate 2px downwards to feel "bouncy."

### Cards
Cards are the primary content vessel. They feature a white background, a 2px border in a very light neutral, and a character icon (Nara or BimoBot) peeking over the top corner for specific categories.

### Progress Bars
Progress tracking uses a "Path" metaphor. Instead of a simple fill, the bar is a thick, soft-teal track. A small circular avatar of **Nara the Explorer** moves along the track as the child completes sections of the encyclopedia.

### Input Fields
Search bars and text inputs are oversized with 24px padding and a soft-teal focus ring. They should always include a friendly placeholder in Indonesian, such as "Cari rahasia alam..."

### Chips/Tags
Used for categories (e.g., "Hewan", "Budaya"). These are colorful, low-profile shapes with white text, utilizing the **Science Purple** for tech-related tags.