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

### December 2025 - MVP Launch

**Backend (FastAPI)**
- `/api/states` - Returns all 50 states with population status
- `/api/states/{state_code}` - Returns detailed state data
- `/api/templates` - Returns 6 downloadable templates
- `/api/templates/download/{id}` - PDF generation with reportlab
- `/api/national-overview` - Returns national guidance content
- `/api/products` - Returns 4 purchasable products
- `/api/checkout/create-session` - Stripe checkout integration
- `/api/checkout/status/{session_id}` - Payment status polling
- `/api/email-capture` - Email lead capture
- `/api/consultation-request` - Consultation form submissions
- `/api/webhook/stripe` - Stripe webhook handler

**Fully Populated States (5):**
- North Carolina (NC)
- Texas (TX)
- California (CA)
- Florida (FL)
- New York (NY)

**Frontend (React)**
- **HomePage**: Hero section, feature cards, state selector grid with search
- **StatePage**: Tabbed interface with 7 sections
- **NationalOverviewPage**: Comprehensive national guidance
- **TemplatesPage**: 6 templates with email capture, premium products section
- **PaymentSuccessPage**: Payment confirmation with polling
- **PaymentCancelPage**: Cancellation handling

**Components:**
- Navbar (glass effect, mobile menu, upgrade dropdown with prices)
- Footer (disclaimer)
- StateSelector (search, badges)
- StepCard, ProgressBar
- ResourceCard (with download trigger)
- EmailCaptureModal (lead capture before download)
- ConsultationModal (booking form)
- InfoSection

**Monetization:**
- 4 Products via Stripe:
  - Complete PDF Guide: $47
  - Editable Templates Bundle: $97
  - Strategy Consultation: $197
  - Full Launch Course: $297
- Email capture on template downloads
- Consultation booking form

---

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- [x] All 50 states selectable
- [x] NC, TX, CA, FL, NY fully populated
- [x] Step-by-step checklist with progress tracking
- [x] PDF templates downloadable
- [x] Stripe payment integration
- [x] Email capture system
- [x] Consultation booking

### P1 (Important)
- [ ] Populate remaining 44 states with real data
- [ ] Create actual editable Word/Excel templates for premium
- [ ] Email notification when leads captured
- [ ] Admin dashboard for viewing leads/payments

### P2 (Nice to Have)
- [ ] User accounts for saved progress
- [ ] Provider directory
- [ ] AI assistant per state
- [ ] State-specific document uploads
- [ ] Newsletter integration (Mailchimp/ConvertKit)

---

## Next Action Items
1. **Populate more states** - Priority: OH, PA, IL, GA, NJ, VA, WA, AZ
2. **Email notifications** - Send alert when consultation/email captured
3. **Admin dashboard** - View leads, payments, and analytics
4. **SEO optimization** - Add meta tags, sitemap, structured data
