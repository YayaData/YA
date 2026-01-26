# Launch Your Peer Support Agency™ - PRD

## Original Problem Statement
Build a web-based app called "Launch Your Peer Support Agency™ — Step-By-Step in Your State (50-State Edition)" - a guided, state-selectable platform that shows users everything needed to open a Medicaid-billable Peer Support Specialist agency in their U.S. state.

## User Personas
1. **Aspiring Peer Support Specialists** - Individuals with lived experience wanting to start their own agency
2. **Social Workers/DSPs** - Professionals looking to expand into Medicaid-billable services
3. **Entrepreneurs** - Business-minded individuals entering behavioral health market
4. **Recovery Community** - People in recovery seeking meaningful career paths

## Core Requirements (Static)
- 50-State coverage with state-specific requirements
- Step-by-step checklist for each state
- Certification, Business Setup, Medicaid, MCO, Supervision, and Billing info
- National Overview section
- Downloadable PDF templates
- Mobile-responsive design
- Blue & gold color scheme on white background

---

## What's Been Implemented

### Phase 1-4: MVP + Monetization + Admin + Compliance (Previous)
- Complete 50-state selector with 13 fully populated states
- 7-tab state page layout (Snapshot, Checklist, Links, Credentialing, Laws, P&P, Zoning)
- Stripe payment integration (5 products)
- Email capture and consultation booking
- Password-protected admin dashboard
- Federal links page

### Phase 5: Security & User Accounts (January 2025)

**Security Overhaul:**
- ✅ JWT-based admin authentication (24-hour tokens)
- ✅ Admin credentials stored in environment variables (not in code)
- ✅ Password hashing with SHA-256
- ✅ Rate limiting: Account locks for 5 minutes after 3 failed login attempts
- ✅ All admin endpoints now require Bearer token authentication

**User Account System:**
- ✅ Magic link authentication (passwordless login)
- ✅ User data model in MongoDB (email, name, state, goal, progress)
- ✅ `/start` onboarding wizard:
  - Step 1: State selection (8 popular + all 50)
  - Step 2: Goal selection (4 options)
  - Progressive disclosure - one decision at a time
  - "Skip" options and reassuring language
- ✅ `/dashboard` user dashboard:
  - Progress tracking with visual progress bar
  - Step-by-step roadmap (first 3 visible, expandable to 11)
  - Quick action cards (Templates, Federal Links, Learn More)
  - Automatic progress saving
- ✅ **Quick Win feature**:
  - Shows one small, easy task at a time
  - Dynamically updates based on user's progress
  - Optional - can be dismissed with X button
  - Warm amber/orange styling, non-intrusive
  - Time estimates and helpful tips for each task
- ✅ **Step Detail Modal**:
  - Opens when clicking any step in the roadmap
  - Shows: intro, what you'll do, why it matters, common mistakes
  - Reassuring language throughout ("You don't need to finish everything at once")
  - Progress message after clicking "Start Step"
  - Completion message when marked complete
  - No scrolling required - simple, focused view
- ✅ **Milestone Celebrations** (calm and minimal):
  - First 3 steps: "Great start" banner
  - 50% progress: "Halfway there" banner
  - Full completion: "All steps complete" banner
  - Subtle green banner, auto-dismisses after 6-8 seconds
  - Can be manually dismissed with X button
  - No animations, pop-ups, or game-like elements
- ✅ **Contextual Resources** (one per step):
  - Step 1: "Apply for EIN" → irs.gov
  - Step 2: "Download Templates" → /templates
  - Step 3: "Search Insurance Providers" → Google search
  - Step 4: "Apply for NPI Number" → nppes.cms.hhs.gov
  - Step 5: "Go to CAQH ProView" → proview.caqh.org
  - Step 6: "Post on Indeed" → indeed.com/hire
  - Step 7: "Download Templates" → /templates
  - Step 8: "Download P&P Template" → /templates
  - Step 9: "Compare Billing Software" → Google search
  - Step 10: "View Federal Links" → /federal-links
  - Step 11: "Learn More" → /national-overview

### Phase 6: Paywall System (January 2025)

**Paywall Implementation - COMPLETED:**
- ✅ **One-time $49 per state purchase model**
- ✅ **Free Access (no payment required):**
  - Account creation & onboarding wizard
  - General roadmap overview
  - First 3 foundation steps (Form Business, Get NPI, Get Insurance)
  - Full access to unpopulated states (37 states)
- ✅ **Premium Access ($49 per state):**
  - All 11 detailed steps with state-specific guidance
  - MCO credentialing links & contacts
  - Downloadable PDF roadmap
  - Steps 4-11 (Medicaid enrollment, MCO credentialing, hiring, supervision, etc.)
- ✅ **Paywall Logic:**
  - Populated states (13) require purchase for premium content
  - Unpopulated states are fully free (no upgrade prompt)
  - Cannot purchase unpopulated states (returns error)
  - Grandfathered users: created before PAYWALL_LAUNCH_DATE get free premium access to their selected state
- ✅ **Frontend UI:**
  - Upgrade card on dashboard for free-tier users on populated states
  - "Unlock Now" button redirects to Stripe checkout
  - Locked steps show lock icon and "Premium" badge
  - Steps 1-3 always accessible (no lock)
- ✅ **Stripe Integration:**
  - State-specific checkout sessions via `/api/checkout/state`
  - Webhook grants state access after successful payment
  - Payment success page shows state unlock confirmation

### Phase 7: Site Visit Readiness (January 2025)

**Site Visit Readiness Section - COMPLETED:**
- ✅ **Calm, checklist-based preparation tool for Medicaid/MCO approval visits**
- ✅ **Visibility:** Appears only when user has completed 6+ steps AND has premium access or is on unpopulated state
- ✅ **Structure:** 4 categories with 12 total items:
  1. **Documentation (3 items):** P&P Manual, Client Intake Forms, Staff Credentials
  2. **Staffing & Supervision (3 items):** Clinical Supervisor Agreement, Job Descriptions, Training Documentation
  3. **Compliance & Safety (3 items):** Insurance Certificates, HIPAA Compliance, Emergency Procedures
  4. **Physical Space (3 items):** ADA Accessibility, Private Meeting Space, Required Postings
- ✅ **Features:**
  - Expandable/collapsible section
  - Progress bar (0/12 to 12/12)
  - Checkable items with persistence in localStorage
  - Reassuring "You're doing great!" message
  - Links to templates where applicable
  - Helpful tip about keeping physical copies
  - Completion celebration message at 100%

### Phase 8: Compliance Reference (January 2025)

**Peer Support Rules & Compliance Section - COMPLETED:**
- ✅ **Plain language summary of Medicaid peer support requirements**
- ✅ **State-specific data for:** NC, TX, CA, FL, NY (other states show generic guidance)
- ✅ **5 Requirement Categories:**
  1. **Eligibility:** Who can be a peer support specialist
  2. **Staffing:** Supervision & staffing requirements
  3. **Documentation:** Documentation requirements
  4. **Training:** Training & certification requirements
  5. **Non-Billable:** Services that cannot be billed
- ✅ **Features:**
  - Educational disclaimer ("Rules change frequently - always verify")
  - Primary Policy Reference with link to official document (e.g., NC Medicaid Clinical Coverage Policy 8G)
  - Expandable/collapsible requirement sections
  - Plain language bullet points (not raw policy text)
  - Connection to Site Visit checklist items (e.g., "Related checklist item: Staff Credentials on File")
  - Quick Compliance Tips section
  - Default data for states without specific info

### Phase 9: Policies & Procedures Section (January 2025)

**Policies & Procedures Section - COMPLETED:**
- ✅ **Calm, non-blocking preparation tool for P&P manual**
- ✅ **Visibility:** Appears when user has completed 5+ steps (later steps)
- ✅ **Two Paths (user's choice):**
  1. **"Use Your Own Policies"** — Track existing policies, mark categories complete
  2. **"P&P Toolkit" ($97)** — Purchase professionally crafted editable templates
- ✅ **6 Policy Categories:**
  1. Operations & Administration
  2. Clinical & Service Delivery
  3. HIPAA & Privacy
  4. Client Rights & Grievances
  5. Emergency & Safety
  6. Compliance & Quality
- ✅ **Features:**
  - Reassuring message: "No rush — work on this when you're ready"
  - Progress bar (0/6 to 6/6 sections)
  - "Upload file" option for each category
  - "Mark as ready" checkbox for each category
  - Does NOT block earlier steps
  - Connection to Site Visit Readiness checklist
  - Link to free templates page

### Phase 10: Document Shop (January 2025)

**Document Shop - COMPLETED:**
- ✅ **À-la-carte document purchases for experienced users**
- ✅ **"I only need documents" CTA on:**
  - User Dashboard
  - Templates page
- ✅ **6 Document Products:**
  1. **Policies & Procedures Manual** - $47 (Core)
  2. **Hiring + Onboarding Packet** - $37 (Core)
  3. **Staff Rules / Employee Handbook** - $37 (Core)
  4. **Supervision Packet** - $29 (State addendum may be required)
  5. **Documentation Pack** - $29 (State addendum may be required)
  6. **Site Visit Readiness Binder** - $24 (Core)
- ✅ **Scope Labels:**
  - **Core (works in all states)** - Green badge - 4 products
  - **State addendum may be required** - Amber badge - 2 products
- ✅ **Bundle Savings:** Individual total $203 vs Bundle $97 (Save $106)
- ✅ **Business Address & Service Location Status:**
  - **Allowed** (green): NC, TX, FL, OH, PA, IL, GA, VA, WA, AZ
  - **Allowed with conditions** (amber): CA, NY, NJ
  - **Must verify** (blue): Default for unknown states
  - Shows 1-2 calm sentences explaining location requirements
  - Prevents users from buying unusable products

### Phase 11: Business Address & Service Location Section (January 2025)

**Business Address & Service Location on State Pages - COMPLETED:**
- ✅ **New informational section** on each populated state page's Snapshot tab
- ✅ **Four status types:**
  - **Allowed (Administrative address only)** - Green badge: NC, TX, FL, OH, PA, IL, GA, VA, WA, AZ
  - **Allowed with conditions** - Amber badge: CA, NY, NJ
  - **Must verify** - Blue badge: Default for unpopulated states
  - **Not recommended** - Red badge: Reserved for future use
- ✅ **State-specific notes** explaining location requirements for each state
- ✅ **Standard explanation text:** "This refers to your business or administrative address and how your service location is listed during enrollment. Rules vary by state, payer, and enrollment type. Always confirm with official Medicaid or MCO guidance before submitting enrollment."
- ✅ **Informational only** - Does not block progress or purchases

### Phase 12: Estimated Costs, Document Shop & Two Paths (January 2025)

**Estimated Cost to Start & Operate Section - COMPLETED:**
- ✅ **New collapsible section** on state pages in Snapshot tab
- ✅ **Intro text:** "Starting a Peer Support agency does not require large upfront capital. Costs vary by state, staffing model, and payer requirements."
- ✅ **One-time setup costs (10 items):**
  - Business registration: $0–$300
  - EIN (IRS): $0 (Free)
  - NPI registration: $0 (Free)
  - Policies & Procedures: $0–$300
  - Hiring & onboarding documents: $0–$150
  - Background checks: $25–$75 each
  - Computer/laptop: $300–$1,000
  - Printer/scanner: $100–$300
  - Office supplies: $50–$150
  - Insurance: $0–$500
- ✅ **One-time total: $300–$2,000** with note about existing equipment
- ✅ **Monthly operating costs (4 items):**
  - QP supervision: $500–$2,000
  - Billing service/software: $0–$300
  - Phone, internet, admin tools: $50–$200
  - EMR (optional): $0–$150
- ✅ **Monthly total: $550–$2,500**
- ✅ **Reassurance text** about one-time purchases and home addresses
- ✅ **Disclaimer** that all costs are estimates
- ✅ **Informational only** - Does not block progress or purchases

**Documents & Templates Only Page - COMPLETED:**
- ✅ **Page title:** "Documents & Templates Only"
- ✅ **Subtitle:** "For providers who already understand the process and only need required documentation."
- ✅ **Intro text** explaining individual purchases without step-by-step guidance
- ✅ **Important Notice** about state-specific addendums
- ✅ **6 Individual purchasable documents (all labeled "Core – Works in All States"):**
  1. Policies & Procedures Manual (Peer Support) - $47
  2. Hiring & Onboarding Packet - $37
  3. Staff Rules & Employee Handbook - $37
  4. Supervision Packet - $29
  5. Documentation Pack - $29
  6. Site Visit Readiness Binder - $24
- ✅ **Bundle option:** All documents for $97 (Save $106)
- ✅ **No onboarding or checklist completion required** to access page

**Choose Your Path Section (Homepage) - COMPLETED:**
- ✅ **New section on homepage** after state selector
- ✅ **Title:** "Choose Your Path"
- ✅ **Two paths presented side by side:**
  - **Path 1 - Guided Setup** (Recommended for most users)
    - Step-by-step guidance
    - State-specific details
    - Templates and readiness tools
    - Optional paid access for deeper guidance
    - "Start Guided Setup →" button → `/start`
  - **Path 2 - Documents Only** (For experienced providers)
    - Purchase individual documents
    - No required guidance
    - No checklist enforcement
    - Intended for experienced providers
    - "Browse Documents" button → `/document-shop`
- ✅ **Calm, non-judgmental language** - neither path implied as better
- ✅ **Reassurance text:** "Both paths provide professional, high-quality resources."

### Phase 13: FAQ Assistant (January 2025)

**Limited AI Help Assistant - COMPLETED:**
- ✅ **Purpose:** Help users understand content in simple language and guide them to correct sections
- ✅ **Scope:** Answers FAQs using ONLY existing app content:
  - General Peer Support agency questions
  - Document explanations (P&P, hiring packet, supervision)
  - Cost and planning questions
  - Checklist item explanations
  - App navigation help (what steps mean, why something is locked)
- ✅ **Response style:**
  - Plain, non-technical language
  - Short answers (2-4 sentences max)
  - Points to relevant pages when helpful
  - Always includes disclaimer: "This information is for educational purposes only. Always verify with official Medicaid or state guidance."
- ✅ **Restrictions:**
  - Does NOT provide legal advice
  - Does NOT interpret state laws
  - Does NOT confirm compliance status
  - Does NOT invent requirements not in app
- ✅ **Placement (user-triggered only, no auto-popups):**
  - State pages: Checklist tab header ("Need help?" link)
  - State pages: Estimated Costs section (? icon)
  - Document Shop page: Header ("Help" pill button)
  - User Dashboard: Roadmap section ("Need help?" link)
  - NOT on homepage (as requested)
- ✅ **Design:**
  - No long conversations or memory
  - Single-turn responses only
  - Optimized for low AI credit usage (GPT-4o-mini)
  - Modal interface with suggested questions

### Phase 14: Enhanced Public Landing Page (January 2025)

**Public Landing Page - COMPLETED:**
- ✅ **Accessible without login** - Anyone can view the full landing page
- ✅ **Hero Section:** Clear headline, description, "Get Started Free" button
- ✅ **What You Can Do:** 5 key platform capabilities
- ✅ **State Selector:** All 50 states with tier badges
- ✅ **Two Paths:** Guided Setup vs Documents Only cards
- ✅ **Estimated Costs:** $300–$2K one-time, $550–$2,500 monthly
- ✅ **Final CTA:** "Ready to Get Started?" with free start button
- ✅ **Footer Disclaimer:** Educational guidance only notice

### Phase 15: Full 50-State National Coverage (January 2025)

**All 50 U.S. States Available - COMPLETED:**
- ✅ **Three-tier coverage system:**
  - **Full Guidance Available** (13 states): NC, TX, CA, FL, NY, OH, PA, IL, GA, NJ, VA, WA, AZ
    - Complete state-specific guidance, enrollment steps, and resources
    - Purchasable ($49 for premium access)
  - **Core Setup Supported** (15 states): TN, MI, MO, IN, WI, MN, CO, SC, KY, OR, LA, OK, CT, MD, MA
    - Universal roadmap with basic state info
    - State addendum coming soon
    - NOT purchasable - universal tools are free
  - **Planning Tools Only** (22 states): All remaining states
    - Access to universal roadmap, documents, and cost planning tools
    - NOT purchasable - universal tools are free

- ✅ **Clear tier labeling in UI:**
  - State selector shows color-coded badges (gold/amber/neutral)
  - State pages show tier badge and explanatory notice
  - Legend explains what each tier means

- ✅ **Honest access controls:**
  - Non-full states cannot be purchased (checkout blocked with clear message)
  - All states have access to universal content (roadmap, documents, cost tools)
  - No misleading "unlock" options for states without full content

**Technical Implementation:**
- Auth tokens: 72-hour expiry for users, 24-hour for admin
- Magic link tokens: 15-minute expiry, single-use
- **Email is MOCKED** - Logs to console, returns `dev_token` in API response for testing
- Progress saved per-state in MongoDB
- Site Visit checklist saved in localStorage: `siteVisitChecklist_{stateCode}`
- P&P progress saved in localStorage: `pp_uploads_{stateCode}`
- Paywall constants: `FREE_STEPS=[1,2,3]`, `PREMIUM_STEPS=[4-11]`, `STATE_ACCESS_PRICE=$49`
- Grandfathering cutoff: `PAYWALL_LAUNCH_DATE="2025-01-15T00:00:00+00:00"`

---

## Fully Populated States (13)
NC, TX, CA, FL, NY, OH, PA, IL, GA, NJ, VA, WA, AZ

## Products (5)
- Complete PDF Guide: $47
- Editable Templates Bundle: $97
- 5-State Bundle: $147
- Strategy Consultation: $197
- Full Launch Course: $297

---

## Credentials

### Admin Access
- **URL**: `/admin`
- **Username**: `admin`
- **Password**: `SYsEnntj4zvaQrNiPPYNsQ`

### User Access
- **URL**: `/start` (onboarding) or `/dashboard` (returning users)
- **Auth**: Magic link (email verification)

---

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] 50 states selectable
- [x] 13 states fully populated with real data
- [x] Step-by-step checklist with progress tracking
- [x] PDF templates downloadable
- [x] Stripe payment integration
- [x] Email capture system
- [x] Consultation booking
- [x] Admin dashboard with JWT auth
- [x] Rate limiting on admin login
- [x] User account system with magic links
- [x] Onboarding wizard
- [x] User dashboard with progress tracking
- [x] **Paywall system ($49/state, free steps 1-3)**

### P1 (Important) - COMPLETED
- [x] Add "Last updated date" to state data (shows "Last updated: January 2025")
- [x] Add "Data source" field ("Official state agency websites and Medicaid provider manuals")
- [x] Implement "Report broken link" feature with modal
- [x] Store broken link reports in MongoDB
- [x] Display broken link reports in admin dashboard with actions (Mark Fixed, Dismiss)
- [x] Show pending link reports count in admin stats
- [x] PDF roadmap downloads for users (clean, simple format with checklist)
- [x] CSV exports for admin (leads, consultations, payments, users with progress)

### P1 (Important) - PENDING
- [ ] Connect real SendGrid for magic link emails
- [ ] Populate remaining 37 states

### P2 (Nice to Have)
- [ ] Compare states feature
- [ ] AI assistant per state
- [ ] Newsletter integration (Mailchimp/ConvertKit)
- [ ] Email notifications for leads/consultations

---

## API Endpoints

### Public
- `GET /api/states` - List all states (includes `is_fully_populated` status)
- `GET /api/states/{code}` - State details
- `GET /api/federal-links` - Federal resources
- `GET /api/templates` - Template list
- `GET /api/products` - Product list (includes `fully_populated_states`)
- `POST /api/email-capture` - Capture email
- `POST /api/consultation-request` - Book consultation
- `POST /api/checkout/create-session` - Stripe checkout for products

### User Auth (Magic Link)
- `POST /api/auth/magic-link` - Request magic link
- `POST /api/auth/verify` - Verify token, get JWT
- `GET /api/auth/me` - Get current user with access info (requires JWT)
- `POST /api/auth/onboarding` - Complete onboarding (requires JWT)

### User Data (Requires JWT)
- `GET /api/user/dashboard` - Dashboard data with paywall info
- `GET /api/user/progress/{state}` - Get progress
- `POST /api/user/progress/{state}` - Save progress
- `PUT /api/user/profile` - Update profile
- `GET /api/user/access/{state}` - Check user's access level for a state

### Paywall/Checkout (Requires JWT)
- `POST /api/checkout/state` - Create Stripe checkout for state access ($49)

### Admin (Requires JWT)
- `POST /api/admin/login` - Login (returns JWT)
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/leads` - All leads
- `GET /api/admin/consultations` - All consultations
- `GET /api/admin/payments` - All payments

---

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Payments**: Stripe
- **PDF**: ReportLab
- **Auth**: JWT (PyJWT)

---

## Next Steps
1. Get SendGrid API key from user to enable real magic link emails
2. Continue populating remaining 37 states
3. Consider all-states bundle option in the future
