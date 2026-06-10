UI Wireframes Descriptions for Pedia Bloom v1
Below are detailed, production-grade textual wireframe descriptions for the most critical screens of the app. These are written to be directly usable by UI/UX designers, frontend engineers, and Figma/Framer teams. Each description includes layout structure, visual hierarchy, components, interactions, states, and accessibility considerations. The overall design language is warm, premium, storybook-adventure style with Indonesian cultural accents (soft gradients of greens, oranges, blues, and earth tones inspired by rice fields, oceans, and sunsets).
Global Design System Elements (applicable to all screens):

Primary Mascot: “Garu” — a friendly young Garuda explorer (cute, round, expressive eyes, scarf with Indonesian flag colors).
Color Palette:
Primary: #FF6B00 (warm orange), #00C853 (lush green)
Secondary: #2196F3 (ocean blue), #FFCA28 (sun yellow)
Neutral: Soft cream #FFF8E1, deep teal #00695C, white with subtle shadows

Typography:
Headings: Bold rounded sans-serif (e.g., “Fredoka” or “Poppins Bold”)
Body: Readable sans-serif, large sizes (min 18–24px for kids)

Icons: Custom playful, rounded, thick-line style with subtle gradients.
Transitions: Bouncy micro-animations (0.3–0.5s), parallax on scroll, mascot reactions.


1. Splash Screen
Purpose: Welcoming first impression, branding, and quick load.
Layout:

Full-screen vertical gradient background (deep blue ocean at bottom → bright sky at top).
Centered large illustration: Garu the mascot flying with Indonesian flag cape, surrounded by floating icons (Komodo, Borobudur, rice field, mountain).
App title “Pedia Bloom” in large playful font with subtle glow at top-center.
Tagline: “Jelajahi Indonesia, Temukan Keajaibannya!” below title.
Bottom: Small loading spinner with “Sedang mempersiapkan petualangan...” (with progress bar for PWA caching).

Interactions: Gentle floating animation on mascot and icons. Tap anywhere to proceed (after 2.5s auto-advance).
States:

Loading: Animated dots.
Error: Friendly retry button with mascot looking concerned.

Accessibility: High contrast logo, screen reader announces “Selamat datang di Pedia Bloom”.

2. Onboarding – Age & Interest Selection (Multi-step Flow)
Purpose: Personalization and parent setup.
Step 1 – Age Selection:

Top: Progress bar (4 steps).
Large header: “Berapa usiamu?” with Garu waving.
Horizontal scrollable big cards (3 options):
5–7: Big smiling sun + “Petualang Kecil”
8–10: Explorer backpack + “Penjelajah Muda”
11–13: Binoculars + “Pencari Pengetahuan”

Each card has large emoji + illustration.

Step 2 – Interests (Multi-select, max 5):

Grid of colorful interest bubbles/cards: Hewan, Sejarah, Makanan, Peta, Pahlawan, Budaya, Alam, Teknologi.
Each bubble has icon + label. Selected ones have checkmark + scale-up animation.

Step 3 – Parent Setup:

Simple form: Parent email/phone, child name, consent checkbox with clear privacy explanation.

Visual Hierarchy: Giant cards > text. Bottom sticky “Lanjut” button (big, orange, with mascot flying).

3. Child Home Dashboard
Purpose: Daily engagement hub.
Layout (Mobile-first, 4-column grid on tablet):

Top Navbar: Garu avatar (left, tappable to profile), app logo (center), bell + parent mode switch (right).
Hero Section: Large Daily Indonesia Fact card with beautiful illustration, “Fakta Hari Ini”, short text, “Dengar” audio button, and “Pelajari Lebih Lanjut” CTA.
Continue Learning: Horizontal scroll of 3–4 in-progress topic cards (progress ring + thumbnail).
Today’s Mission: Highlighted card with 2–3 missions (e.g., “Temukan 1 pulau baru”).
Explore Indonesia Map Teaser: Big interactive map preview card with “Jelajahi Peta” button.
Recommended Topics: Vertical or grid of topic cards filtered by age/interest.
Bottom Navigation: Home | Peta | Ensiklopedia | Games | Cerita | Profil.

Animations: Confetti on streak days, mascot waving when opening app.
Empty State: Friendly illustration of Garu saying “Mari mulai petualangan pertamamu!” + big CTA.

4. Interactive Indonesia Map
Purpose: Core exploratory experience.
Layout:

Full-screen map (Leaflet or SVG-based vector map of Indonesia).
Top filter bar: Layers toggle (Alam, Sejarah, Budaya, Fauna, Provinsi, etc.) as colorful pills.
Pinch-to-zoom, tap provinces/islands → pop-up modal with location name, short fact, “Baca Selengkapnya”, and thumbnail.
Bottom sheet on tablet/desktop shows detailed info.
Floating action button: “Random Adventure” (Garu spins and picks location).

Interactions:

Tap province → zoom + highlight with glowing border + fun sound.
Layer toggles animate map elements appearing (animals pop up, historical markers glow).

Visuals: Vibrant colors per layer, subtle parallax clouds and waves.

5. Encyclopedia Category Library
Purpose: Browse content.
Layout:

Top search bar with voice input icon.
Horizontal category chips (15 categories).
Masonry/grid of topic cards: Large image at top, title, age badge (small colored dot), difficulty stars, estimated time.
Filters (side drawer on tablet): Age, Province, Theme, Has Quiz/Video.

Card Design: Rounded corners, subtle shadow, hover lift on desktop, “Favorit” heart icon.

6. Topic Detail Page
Purpose: Deep learning experience.
Layout (Scrollable):

Hero image/illustration (full width, parallax scroll).
Title + age level badge + audio play button (prominent).
Tabs/Segments: Versi Mudah | Versi Sedang | Versi Lengkap.
Sections in order:
Opening Story (illustrated box)
What is it? / Why Important?
Fun Facts (numbered cards with icons)
Indonesia Connection (mini map highlight)
Interactive Element (embedded mini-game or drag-drop)
Mini Quiz (start button)
Challenge + Glossary (accordion)

Floating bottom bar: Save | Share (to parent) | Next Topic.

Parent/Teacher Note: Collapsible section at bottom with lock icon.

7. Quiz Page
Purpose: Assessment & reinforcement.
Layout:

Progress bar at top (Question 1 of 5).
Large question text with illustration.
4 answer choices as big colorful cards (with icons where possible).
Immediate feedback: Green/red with mascot reaction + explanation.
After quiz: Score screen with badges earned, retry option, and “Lanjut ke Cerita”.

Types: Multiple choice, drag-and-drop (province to island), matching pairs.

8. Story Adventure Page
Purpose: Narrative-driven learning.
Layout:

Chapter map (horizontal scroll or vertical path like a board game).
Current chapter illustration dominates screen.
Text in speech bubbles or storybook pages.
Choices that affect story lightly (non-branching for simplicity).
Unlock knowledge cards at chapter end.

Mascot: Garu appears as narrator/guide, with lip-sync animation on audio.

9. Parent Dashboard
Purpose: Monitoring & guidance.
Layout:

Top: Child avatar + name + overall progress circle.
Tabs: Progress | Interests | Strengths | Reports.
Charts: Donut by category, line chart weekly time, heat map of topics.
Recommended next topics + printable activity sheet buttons.
Privacy toggle and time-limit settings.

Design: Cleaner, less playful than child views, professional yet warm tones.

10. Badge & Achievement Page
Layout:

Grid of badge icons (locked = grayscale, earned = glowing + confetti).
Collection book style with categories (Island Explorer, Culture Hero, etc.).
Progress toward next level shown as treasure map.


Additional Notes for Implementation:

Responsive Breakpoints: Mobile (<768px), Tablet 7" (portrait/landscape), Tablet 11", Desktop.
Offline States: Cached topics show “Tersedia Offline” badge with cloud-strike icon.
Loading Skeletons: Shimmering cards mimicking content layout.
Accessibility:
ARIA labels everywhere.
Focus management for keyboard navigation.
VoiceOver/TalkBack friendly.
Dyslexia font toggle in settings.
Minimum touch target 48x48dp.


These wireframe descriptions provide a complete visual and interaction blueprint. They maintain consistency while feeling magical and age-appropriate.
Would you like me to expand any specific screen into even more granular component breakdowns, provide Figma-style component specs, or generate sample illustrations prompts for the UI elements?