# Design System

Version: 1.0
Design Language: Material 3 Expressive Inspired
Primary Brand Color: Purple
Typography: Plus Jakarta Sans + DM Sans

---

# Philosophy

The app follows a Material 3 Expressive-inspired design system focused on clarity, warmth, accessibility, and visual hierarchy.

Core principles:

* Expressive but not playful
* Professional but approachable
* Premium without feeling corporate
* Consistent across light and dark themes
* Layered surfaces instead of flat backgrounds
* Meaningful use of color
* Motion that supports understanding

The primary accent color is purple and serves as the foundation of the visual identity.

---

# Brand Identity

## Personality

The app should feel:

* Modern
* Calm
* Intelligent
* Trustworthy
* Human
* Organized

Avoid:

* Neon colors
* Excessive gradients
* Harsh shadows
* Glassmorphism
* Overly rounded cartoon styles
* Corporate blue-heavy aesthetics

---

# Color System

## Primary

Light Theme

Primary:
#6750A4

Primary Hover:
#5B45A0

On Primary:
#FFFFFF

Primary Container:
#EADDFF

On Primary Container:
#21005D

Dark Theme

Primary:
#D0BCFF

Primary Hover:
#C4A8FF

On Primary:
#381E72

Primary Container:
#4F378B

On Primary Container:
#EADDFF

---

## Secondary

Used for supporting emphasis.

Light Theme

Secondary:
#625B71

Secondary Container:
#E8DEF8

Dark Theme

Secondary:
#CCC2DC

Secondary Container:
#4A4458

---

## Tertiary

Used sparingly for visual differentiation.

Light Theme

Tertiary:
#7D5260

Tertiary Container:
#FFD8E4

Dark Theme

Tertiary:
#EFB8C8

Tertiary Container:
#633B48

---

# Surface System

Never use pure white layouts.

Never use pure black layouts.

Use layered surfaces.

## Light Theme

Surface Lowest
#FFFFFF

Surface Low
#F7F2FA

Surface
#FFFBFE

Surface High
#ECE6F0

Surface Highest
#E6E0E9

---

## Dark Theme

Surface Lowest
#0F0D13

Surface Low
#1D1B20

Surface
#141218

Surface High
#2B2930

Surface Highest
#36343B

---

# Text Colors

## Light Theme

Primary Text:
#1C1B1F

Secondary Text:
#3C3844

Disabled:
#6B6773

---

## Dark Theme

Primary Text:
#E6E1E5

Secondary Text:
#D0CBD8

Disabled:
#A09BA7

---

# Semantic Colors

## Success

Light

Color:
#186A3B

Container:
#D4EDDA

Dark

Color:
#A8D5B5

Container:
#1A4D2B

---

## Warning

Light

Color:
#8B5E00

Container:
#FDEEBA

Dark

Color:
#F5C842

Container:
#4A3200

---

## Error

Light

Color:
#B3261E

Container:
#F9DEDC

Dark

Color:
#F2B8B5

Container:
#8C1D18

---

# Mood Scale

Used for emotional analytics, insights, and sentiment visualization.

Level 1
#B3261E

Level 2
#E8650A

Level 3
#8B5E00

Level 4
#186A3B

Level 5
#6750A4

Dark Mode

Level 1
#F2B8B5

Level 2
#FFB77A

Level 3
#F5C842

Level 4
#A8D5B5

Level 5
#D0BCFF

---

# Typography

## Font Stack

Display

Plus Jakarta Sans

Body

DM Sans

Monospace

Roboto Mono
JetBrains Mono
Fira Code

---

# Type Scale

## Display Large

48px

Weight:
800

Line Height:
56px

Usage:
Landing screens
Major metrics
Hero content

---

## Display Medium

40px

Weight:
700

Line Height:
48px

---

## Headline Large

32px

Weight:
700

Line Height:
40px

---

## Headline Medium

28px

Weight:
700

Line Height:
36px

---

## Title Large

22px

Weight:
600

Line Height:
28px

---

## Title Medium

18px

Weight:
600

Line Height:
24px

---

## Body Large

16px

Weight:
400

Line Height:
24px

---

## Body Medium

14px

Weight:
400

Line Height:
20px

---

## Label Large

14px

Weight:
500

Line Height:
20px

---

## Label Medium

12px

Weight:
500

Line Height:
16px

---

# Shape System

XS
4px

SM
8px

MD
12px

LG
16px

XL
24px

FULL
9999px

---

# Component Radius

Buttons:
12px

Inputs:
12px

Cards:
16px

Bottom Sheets:
24px

Dialogs:
24px

Chips:
9999px

Badges:
9999px

---

# Elevation

Elevation 1

Standard cards

Elevation 2

Hovered cards

Sticky surfaces

Elevation 3

Dropdowns

Side panels

Floating actions

Elevation 4

Dialogs

Modals

Critical overlays

---

# Spacing System

Base Unit

4px

Scale

4
8
12
16
20
24
32
40
48
64
80
96

Preferred Layout Gaps

Small:
16px

Medium:
24px

Large:
32px

Section:
48px

Screen:
64px

---

# Layout

## Desktop

Maximum Width

1440px

Content Width

1280px

Page Padding

32px

---

## Tablet

Page Padding

24px

---

## Mobile

Page Padding

16px

---

# Navigation

## Sidebar

Width:
280px

Background:
Surface Low

Active Item:

Background:
Primary Container

Text:
On Primary Container

Icon:
Primary

---

## Top App Bar

Height:
64px

Background:
Surface

Border:
Outline Variant

Contains:

Page title

Search

Actions

Profile

---

# Cards

Cards are the primary layout primitive.

Default Card

Background:
Surface Container

Radius:
16px

Elevation:
1

Padding:
24px

---

Hover State

Elevation:
2

Translate Y:
-2px

Duration:
200ms

---

# Buttons

## Primary Button

Background:
Primary

Text:
On Primary

Use only for the highest-priority action.

Maximum one primary action per section.

---

## Secondary Button

Background:
Secondary Container

Text:
On Secondary Container

Used for supporting actions.

---

## Tonal Button

Background:
Primary Container

Text:
On Primary Container

Used for medium emphasis.

---

## Text Button

Transparent background.

Used for tertiary actions.

---

# Inputs

Height:
48px

Radius:
12px

Background:
Surface Lowest

Border:
Outline Variant

Focus Border:
Primary

Focus Ring:
Primary Container

---

# Chips

Default

Background:
Surface High

Text:
On Surface

Selected

Background:
Primary Container

Text:
On Primary Container

---

# Dialogs

Background:
Surface

Radius:
24px

Elevation:
4

Maximum Width:
560px

Padding:
24px

---

# Data Visualization

Use the purple palette first.

Priority Order

Primary

Secondary

Tertiary

Success

Warning

Error

Charts should always support dark mode.

Never use saturated neon colors.

---

# Motion

Standard

200ms

Curve

cubic-bezier(0.2, 0, 0, 1)

Expressive

350ms

Curve

cubic-bezier(0.34, 1.56, 0.64, 1)

Allowed Animations

Fade

Scale

Elevation

Container Transform

Slide

Opacity

Avoid:

Bounce effects

Infinite motion

Large rotations

Distracting transitions

---

# Accessibility

Minimum text contrast:
WCAG AA

Interactive targets:
44x44px minimum

Keyboard navigation:
Required

Visible focus states:
Required

Dark mode parity:
Required

Reduced motion support:
Required

---

# Screen Blueprint

Every new screen should follow this structure.

Top App Bar

↓

Page Header

↓

Primary Content

↓

Supporting Content

↓

Footer Actions

Spacing

Header → Content:
32px

Section → Section:
32px

Card → Card:
24px

Element → Element:
16px

---

# Consistency Rules

1. Purple is always the primary accent.

2. Never introduce new accent colors without design approval.

3. Use surfaces instead of flat backgrounds.

4. Use cards as the primary organizational unit.

5. Respect spacing scale.

6. Respect typography scale.

7. All components must support light and dark themes.

8. Use Material-inspired interaction patterns.

9. Maintain expressive but restrained visuals.

10. Every screen should feel like it belongs to the same app, regardless of feature area.
