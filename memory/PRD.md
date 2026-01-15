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
- Downloadable templates
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
- `/api/national-overview` - Returns national guidance content
- North Carolina (NC) fully populated with real data

**Frontend (React)**
- **HomePage**: Hero section, feature cards, state selector grid with search
- **StatePage**: Tabbed interface with 7 sections (Checklist, Certification, Business Setup, Medicaid, MCOs, Supervision, Billing)
- **NationalOverviewPage**: What is Peer Support, Medicaid billing basics, universal requirements, best practices, multi-state expansion
- **TemplatesPage**: 6 templates with preview, category filtering, and download buttons
- **Components**: Navbar (glass effect, mobile menu), Footer (disclaimer), StateSelector, StepCard, ProgressBar, ResourceCard, InfoSection

**Design**
- Libre Baskerville (serif) for headings, DM Sans for body
- Navy (#0F172A) primary, Gold (#B45309) accent
- Card hover effects, fade-in animations
- Mobile-responsive navigation

---

## Prioritized Backlog

### P0 (Critical)
- [x] All 50 states selectable
- [x] NC fully populated
- [x] Step-by-step checklist with progress tracking
- [x] Basic templates available

### P1 (Important)
- [ ] Populate remaining 49 states with real data
- [ ] Generate actual PDF templates for download
- [ ] Add state comparison feature
- [ ] Implement save/export checklist progress to localStorage

### P2 (Nice to Have)
- [ ] User accounts for saved progress
- [ ] Provider directory
- [ ] AI assistant per state
- [ ] State-specific document uploads
- [ ] Email capture for lead generation

---

## Next Action Items
1. **Populate additional states** - Start with high-demand states (TX, CA, FL, NY)
2. **Create actual PDF templates** - Convert preview text to downloadable PDFs
3. **Add upsell integration** - Connect upgrade buttons to payment flow
4. **SEO optimization** - Add meta tags, sitemap, structured data
5. **Analytics integration** - Track state selection, template downloads
