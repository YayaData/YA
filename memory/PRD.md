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

**Technical Implementation:**
- Auth tokens: 72-hour expiry for users, 24-hour for admin
- Magic link tokens: 15-minute expiry, single-use
- **Email is MOCKED** - Logs to console, returns `dev_token` in API response for testing
- Progress saved per-state in MongoDB

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

### P1 (Important) - PENDING
- [ ] Connect real SendGrid for magic link emails
- [ ] Add "Last updated date" to state data
- [ ] Implement "Report broken link" feature
- [ ] Add PDF export for state roadmaps
- [ ] Add CSV export to admin dashboard
- [ ] Populate remaining 37 states

### P2 (Nice to Have)
- [ ] Compare states feature
- [ ] AI assistant per state
- [ ] Newsletter integration (Mailchimp/ConvertKit)
- [ ] Email notifications for leads/consultations

---

## API Endpoints

### Public
- `GET /api/states` - List all states
- `GET /api/states/{code}` - State details
- `GET /api/federal-links` - Federal resources
- `GET /api/templates` - Template list
- `GET /api/products` - Product list
- `POST /api/email-capture` - Capture email
- `POST /api/consultation-request` - Book consultation
- `POST /api/checkout/create-session` - Stripe checkout

### User Auth (Magic Link)
- `POST /api/auth/magic-link` - Request magic link
- `POST /api/auth/verify` - Verify token, get JWT
- `GET /api/auth/me` - Get current user (requires JWT)
- `POST /api/auth/onboarding` - Complete onboarding (requires JWT)

### User Data (Requires JWT)
- `GET /api/user/dashboard` - Dashboard data
- `GET /api/user/progress/{state}` - Get progress
- `POST /api/user/progress/{state}` - Save progress
- `PUT /api/user/profile` - Update profile

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
2. Add trust indicators (last updated dates, report broken links)
3. Implement export features (PDF roadmaps, CSV for admin)
4. Continue populating remaining states
