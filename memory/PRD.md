# Anchor Place – Client Placement PRD

## Original Problem Statement
Build a simple, professional web app called "Anchor Place – Client Placement" that helps hospitals, social workers, LMEs, jails, reentry programs, and housing providers coordinate placement for people with complex needs (IDD, behavioral health, mental health, reentry, post-hospital discharge).

## User Choices
- **Data Storage**: MongoDB (persistent)
- **Design**: Calming blues with neutral tones (white, light gray)
- **Features**: Simple as described, no email notifications

## User Personas
1. **Hospital Discharge Planners** - Need to find post-acute care placements
2. **Social Workers/Case Managers** - Coordinate housing for clients
3. **LME/MCO Coordinators** - Manage care placements for covered populations
4. **Jail/Reentry Staff** - Find transitional housing for individuals
5. **Housing Providers** - List available placements

## Core Requirements
- Welcome screen with 4 main actions
- NO PHI collection (protected health information)
- Simple forms with clear labels
- Step-by-step guidance

## What's Been Implemented (Jan 14, 2025)
### Backend (FastAPI + MongoDB)
- [x] Placements CRUD endpoints
- [x] Placement requests endpoint
- [x] Provider inquiries endpoint
- [x] Reference data endpoints (types, services, sources)
- [x] Demo data seeding

### Frontend (React + shadcn/UI)
- [x] Welcome Screen with 4 action cards
- [x] Place a Client - 3-step form wizard
- [x] Available Placements - filterable grid
- [x] How It Works - educational content + FAQs
- [x] Start a Placement Idea - provider inquiry form
- [x] Toast notifications (sonner)
- [x] Responsive design

## Tech Stack
- **Backend**: FastAPI, Motor (async MongoDB), Pydantic
- **Frontend**: React, Tailwind CSS, shadcn/UI
- **Database**: MongoDB

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Core 4 navigation flows
- [x] Placement request submission
- [x] Placements listing with filters

### P1 (Important) - Future
- [ ] Admin dashboard for managing placements
- [ ] Edit/update placements
- [ ] Search functionality across all content
- [ ] User authentication for providers

### P2 (Nice to Have) - Future
- [ ] Email notifications for new requests
- [ ] Export placement data
- [ ] Analytics/reporting dashboard
- [ ] Mobile app version

## Next Action Items
1. Add admin interface for managing placements
2. Implement user authentication for providers
3. Add email notifications when requests are submitted
