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
- No login required for MVP
- Blue & gold color scheme on white background

---

## What's Been Implemented

### December 2025 - MVP + Phase 2 + Phase 3

**Backend (FastAPI)**
- Complete API with 20+ endpoints
- PDF generation with reportlab
- Stripe payment integration (5 products)
- Email capture and consultation request storage
- Password-protected admin API

**Fully Populated States (13):**
- North Carolina (NC)
- Texas (TX)
- California (CA)
- Florida (FL)
- New York (NY)
- Ohio (OH)
- Pennsylvania (PA)
- Illinois (IL)
- Georgia (GA)
- New Jersey (NJ)
- Virginia (VA)
- Washington (WA)
- Arizona (AZ)

**Products (5):**
- Complete PDF Guide: $47
- Editable Templates Bundle: $97
- **5-State Bundle: $147** (NEW)
- Strategy Consultation: $197
- Full Launch Course: $297

**Admin Dashboard:**
- Password-protected access at `/admin`
- Stats overview (leads, consultations, payments, revenue)
- Tabs for Leads, Consultations, Payments
- Refresh and logout functionality

**Frontend Pages:**
- HomePage with hero, features, state selector
- StatePage with 7 tabbed sections
- NationalOverviewPage
- TemplatesPage with email capture
- PaymentSuccessPage / PaymentCancelPage
- **AdminPage** (NEW)

---

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] All 50 states selectable
- [x] 13 states fully populated with real data
- [x] Step-by-step checklist with progress tracking
- [x] PDF templates downloadable
- [x] Stripe payment integration
- [x] Email capture system
- [x] Consultation booking
- [x] Admin dashboard
- [x] State Bundle product

### P1 (Important)
- [ ] Populate remaining 37 states with real data
- [ ] Email notifications when leads/consultations submitted (SendGrid)
- [ ] Export leads to CSV from admin
- [ ] Update consultation status from admin

### P2 (Nice to Have)
- [ ] User accounts for saved progress
- [ ] Provider directory
- [ ] AI assistant per state
- [ ] Newsletter integration (Mailchimp/ConvertKit)

---

## Admin Access
- **URL**: `/admin`
- **Password**: Chris229@@@

---

## Next Action Items
1. **Populate more states** - Next batch: MI, MA, TN, MD, IN, MO, WI, SC
2. **Add SendGrid email notifications** - Alert when leads captured
3. **Admin enhancements** - Export to CSV, update consultation status
4. **SEO optimization** - Meta tags, sitemap, structured data
