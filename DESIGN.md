# AML Consultant LLC — Design System (Google Stitch Standard)

This document establishes the official Design System and UI tokens for **AML Consultant LLC**, specifically tailored for Google Stitch (`stitch.withgoogle.com`) and modern frontend implementations.

---

## 1. Brand Identity & Design Philosophy

- **Domain**: Anti-Money Laundering (AML), Bank Secrecy Act (BSA), Counter-Financing of Terrorism (CFT), OFAC Sanctions, and Financial Crimes Technology Advisory.
- **Aesthetic Tone**: *Executive Fintech Clarity & Regulatory Authority*. Conveys institutional trust, forensic precision, compliance stability, and modern technological agility.
- **Visual Style**: Light Blue Executive Canvas layered with Crisp White Cards, Frosted Glassmorphism, Accent Warm Gold (prestige, certification authority), Royal Azure Blue (institutional stability) and Emerald (audit clearance, security pass).
- **Logo**: Triangular 3D Pyramid Prism with central "A" and "AML Consultant" inscription, featuring 100% native alpha transparency without solid background blocks.

---

## 2. Color System & Design Tokens

### Primary & Background Palette
```css
--bg-canvas: #EDF4FC;           /* Executive Light Blue Canvas */
--bg-surface: #FFFFFF;          /* Pure White Card Surface */
--bg-surface-elevated: #F8FBFF; /* Elevated Hover / Focus Surface */
--bg-glass: rgba(237, 244, 252, 0.92);
--border-subtle: rgba(37, 99, 235, 0.12);
--border-medium: rgba(37, 99, 235, 0.22);
--border-highlight: rgba(245, 158, 11, 0.35);
--border-focus: #2563EB;
```

### Accent & Semantic Palette
```css
/* Gold / Prestige & CAMS/CFE Badges */
--gold-500: #D97706;
--gold-400: #B45309;
--gold-gradient: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
--gold-glow: rgba(217, 119, 6, 0.20);

/* Blue / Institutional Authority */
--blue-500: #2563EB;
--blue-600: #1D4ED8;
--blue-700: #1E40AF;
--blue-gradient: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%);

/* Emerald / Audit Compliance & Clean Check */
--emerald-500: #059669;
--emerald-400: #10B981;
--emerald-glow: rgba(16, 185, 129, 0.20);

/* Slate & Neutral Text */
--text-primary: #0F172A;        /* Deep Slate 900 */
--text-secondary: #334155;      /* Slate 700 */
--text-muted: #64748B;          /* Slate 500 */
--text-highlight: #0284C7;
```

---

## 3. Typography Hierarchy

- **Headings Font**: `'Outfit', 'Plus Jakarta Sans', -apple-system, sans-serif`
  - Weight: 700 (Bold), 800 (ExtraBold)
  - Letter Spacing: `-0.02em` for punchy executive titles
- **Body & UI Font**: `'Plus Jakarta Sans', 'Inter', sans-serif`
  - Weight: 400 (Regular), 500 (Medium), 600 (SemiBold)
  - Line Height: `1.6` for optimal readability in technical compliance explanations

### Scale:
- `Display Hero`: `clamp(2.5rem, 5vw, 4.25rem)` / Weight: 800
- `H1 / Section Titles`: `clamp(1.875rem, 3.5vw, 2.75rem)` / Weight: 700
- `H2 / Card Headers`: `1.375rem` - `1.625rem` / Weight: 600
- `Body Text`: `1rem` (16px) / Line height: 1.6
- `Badges & Microcopy`: `0.75rem` - `0.875rem` / Weight: 600, uppercase with letter-spacing `0.05em`

---

## 4. Components Specification (Google Stitch Ready)

### 1. Navigation Bar (`Navbar`)
- **Structure**: Floating fixed container with `backdrop-filter: blur(16px)`, `border: 1px solid var(--border-subtle)`.
- **Elements**: Brand logo, Navigation links with subtle gold indicator on active, Language Switcher (`EN | ES`), and Primary CTA Button ("Schedule Audit / Agendar Consulta").

### 2. Hero Section (`HeroCompliance`)
- **Visuals**: Ambient radiant gradient in background (`radial-gradient(ellipse at 50% -20%, rgba(37, 99, 235, 0.25), transparent 70%)`).
- **Pre-Header Badge**: `[VERIFIED BSA/AML ADVISORY]` in gold pill badge.
- **Title**: High-converting value proposition targeting institutional compliance officers.
- **Key Metrics Row**:
  - `24+` Years of AML / BSA Industry Leadership
  - `3` Elite Master Certifications (`CFE`, `CAMS`, `CAFCA`)
  - `15+` Bank Core & Surveillance Systems Mastered
  - `100%` Independent Audit Integrity Track Record
- **CTAs**: Primary ("Request Risk Assessment") + Secondary ("Explore Services & E-Learning").

### 3. Service Cards Grid (`ServiceCard`)
- 4 Core Pillars:
  1. **AML / BSA & OFAC Advisory**: Policy development, risk assessments, independent oversight.
  2. **Core Banking & Surveillance Implementation**: Bridger Insight, Global Radar, Mambu, MeridianLink, Fiserv, BAM+.
  3. **BSA Independent Audits & KYC Site Visits**: 5 Pillars testing, Enhanced Due Diligence (EDD), Pronto Forms field inspection.
  4. **Custom E-Learning & Board Assessments**: Tailored LMS modules, pre-employment testing, director briefings.
- **Interaction**: Card hover elevates by `translateY(-6px)` with a subtle radial gradient illumination following cursor and border accentuation.

### 4. Founder Dossier (`FounderDossier`)
- Highlight **Leo I. Rivera, CFE, CAMS, CAFCA**.
- High-res portrait with gold geometric halo framing.
- Tabbed interactive badges for each certification with modal / tooltip verification details.
- Active roles as BSA Officer for multiple Puerto Rico & US financial institutions.
- Comprehensive systems taxonomy (Core, AML Engine, KYC, Due Diligence).

### 5. Trust & Client Proof Carousel (`ClientTicker`)
- Logos displayed in high-contrast monochrome with gold/color hover transition.
- Includes institutional clients: ItalBank, Payblr, BNCI, FincAdvisors, TU Coop, UIBC, SIB, Encanto Group, GK Bank.

### 6. E-Learning Interactive Portal (`ELearningSuite`)
- Showcase 3 flagship modules:
  - **CDD Basic Training** (Customer Due Diligence)
  - **BSA Officer & Analyst Assessment Exam**
  - **OFAC Regulation & Sanctions Compliance Test**
- Visual status tags: `Interactive Module`, `Certification Prep`, `Executive LMS`.
- Action buttons launching demo invites or modal descriptions.

### 7. Audit & Consultation Diagnostic Form (`DiagnosticForm`)
- Multi-step interactive form allowing prospective clients to select:
  - Institution Type (International Bank, Fintech/Neobank, Credit Union/Coop, MSB, Crypto/Other).
  - Primary Need (Independent BSA Audit, AML System Calibration, Policy Drafting, Staff Training).
  - Contact inputs with instant validation and secure submission dispatch.

---

## 5. Micro-Interactions & Motion
- Button transitions: `cubic-bezier(0.16, 1, 0.3, 1)` duration `250ms`.
- Stat counters: Smooth counting animation when scrolled into viewport.
- Theme coherence: Dark mode native with crisp high-contrast readability meeting WCAG AAA standard for compliance tools.
