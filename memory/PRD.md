# Anchor Placement – Client Placement PRD

## Original Problem Statement
Build a professional web app called "Anchor Placement – Client Placement" that helps hospitals, social workers, LMEs, jails, reentry programs, and housing providers coordinate placement for people with complex needs (IDD, behavioral health, mental health, reentry, post-hospital discharge).

## User Choices
- **Data Storage**: MongoDB (persistent)
- **Design**: Calming blues with teal accent and warm gold CTAs (Primary Blue: #1F4FD8, Teal: #1CB5A3, Gold: #F4B400)
- **Features**: Two-sided marketplace with role-based routing, no PHI collection
- **Fonts**: Poppins, Inter/Open Sans

## User Personas
1. **Providers** (AFL Providers, Group Homes, Transitional Housing, etc.) - List available space
2. **Requestors** (Hospital Discharge Planners, Case Managers, Shelters, etc.) - Find placements for clients
3. **Administrators** - Manage platform and view analytics

## Core Requirements
- Welcome screen with clear CTAs for providers and requestors
- NO PHI collection (protected health information)
- Multi-step onboarding quiz with role-based routing
- Dynamic dashboards based on user type
- Placement matching using MATCH_FLAGS

## Tech Stack
- **Backend**: FastAPI, Motor (async MongoDB), Pydantic
- **Frontend**: React, Tailwind CSS, shadcn/UI
- **Database**: MongoDB

---

## What's Been Implemented

### Latest Updates (Jan 30, 2025)
- [x] **P0: Backend Persistence for Admin Actions**
  - Agency Approve/Suspend now persists to MongoDB via `PATCH /api/provider-inquiries/{id}`
  - Status updates: pending → approved, pending → suspended, suspended → approved (reinstate)
  - Admin Dashboard displays status badges and grouped agency sections
  - File: `server.py` - `update_provider_inquiry()`, `AdminDashboard.jsx` - `handleApproveAgency()`, `handleSuspendAgency()`

- [x] **P1: Backend File Upload for Credentialing Documents**
  - Documents uploaded via `POST /api/credentials/upload` (multipart form data)
  - Files stored on disk in `/app/backend/uploads/credentials/{org_name}/`
  - Metadata stored in MongoDB `credential_documents` collection
  - Supports PDF, JPEG, PNG (max 10MB)
  - Endpoints: upload, list, download, delete
  - File: `server.py` - `upload_credential_document()`, `DocumentUpload.jsx` - `handleFile()`

- [x] **Script B - Closure Response Modal** for Housing Interest requests
  - Admin can close housing interest requests with standardized response
  - Modal displays Script B message before confirmation
  - Admin notes saved to database with closure message
  - File: `AdminDashboard.jsx` - `handleCloseWithScript()`, `confirmCloseWithScript()`

### Previous Updates (Jan 22-29, 2025)

### Backend (FastAPI + MongoDB)
- [x] Health check endpoints (`/health`, `/api/health`)
- [x] Placements CRUD endpoints (`/api/placements`)
- [x] Placement requests endpoint (`/api/placement-requests`)
- [x] Provider inquiries endpoint (`/api/provider-inquiries`)
- [x] Reference data endpoints (types, services, sources)
- [x] Demo data seeding

### Frontend (React + shadcn/UI)
- [x] Welcome Screen with vibrant hero section
- [x] Multi-step Onboarding Quiz (5 steps)
- [x] Role-based routing (Providers → Provider Dashboard, Requestors → Requestor Dashboard)
- [x] Provider Dashboard with:
  - Placements list with status badges
  - Incoming requests view
  - Preferences panel (MATCH_FLAGS checkboxes)
- [x] Requestor Dashboard with:
  - Placement requests list
  - Quick action cards
- [x] Admin Dashboard with stats and system alerts
- [x] Place a Client - 3-step form wizard
- [x] Available Placements - filterable grid
- [x] How It Works - educational content + FAQs
- [x] Start a Placement Idea - provider inquiry form

### Constants & Utilities Created
- [x] `organizationCapabilities.js` - ORG_CAPABILITIES, ORG_TYPE_LABELS, ORG_TYPE_GROUPS
- [x] `matchFlags.js` - MATCH_FLAGS, PROVIDER_ACCEPTANCE_FLAGS, checkMatchCompatibility
- [x] `placementSchemas.js` - Dynamic form schemas by org type
- [x] `userRoles.js` - USER_ROLES, ROLE_PERMISSIONS, hasPermission
- [x] `routeByOrgType.js` - getDashboardRoute, canProvidePlacement, route guards
- [x] `generateMatchFlags.js` - Flag generation and matching utilities

---

## Key Features Completed

### Admin Agency Management (P0 - Complete)
- Approve/Suspend agencies with backend persistence
- Status badges: Pending (amber), Approved (green), Suspended (red)
- Reinstate suspended agencies
- Grouped view in Agency Management section

### Credentialing Document Upload (P1 - Complete)
- Backend file upload endpoint with multipart form data
- Disk storage + MongoDB metadata
- File validation (PDF, JPEG, PNG, max 10MB)
- Upload, list, download, delete endpoints
- Loading state during upload

### Housing Interest Feature (Complete)
- Public `/housing-interest` page for individuals
- Admin review workflow with status tracking (pending → reviewed → contacted → closed)
- CSV export functionality
- Script A response for contacted individuals
- **Script B closure response modal** with standardized unavailability message

### Credentialing System V1 (Complete)
- North Carolina state-specific requirements
- Self-attestation checklist
- Document upload with backend storage

### Placement Request Board V1 (Complete)
- Public `/submit-request` page for individuals
- Admin moderation workflow
- Agency connection request system

### Feature Flags (Complete)
- `READ_ONLY_AUDIT` mode for compliance reviews
- `EXPORT_REPORTS` toggle for CSV/PDF exports

---

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Core navigation flows
- [x] Placement request submission
- [x] Placements listing with filters
- [x] Multi-step onboarding quiz
- [x] Role-based routing to dashboards
- [x] Provider Preferences panel

### P1 (Important) - In Progress
- [ ] Dynamic placement forms based on `placementSchemas.js`
- [ ] Provider-request matching using MATCH_FLAGS
- [ ] Edit/update placements functionality
- [ ] Search functionality across all content

### P2 (Nice to Have) - Future
- [ ] User authentication for providers
- [ ] Email notifications for new requests
- [ ] Export placement data
- [ ] Analytics/reporting dashboard
- [ ] Provider readiness check feature
- [ ] "Become a Provider" guide

---

## Key Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | WelcomeScreen | Homepage with hero and CTAs |
| `/onboarding` | Onboarding | 5-step qualification quiz |
| `/provider-dashboard` | ProviderDashboard | Provider's main dashboard |
| `/requestor-dashboard` | RequestorDashboard | Requestor's main dashboard |
| `/admin` | AdminDashboard | Admin view of all data |
| `/place-client` | PlaceClient | 3-step placement request form |
| `/placements` | Placements | Browse available placements |
| `/how-it-works` | HowItWorks | Educational content |
| `/start-idea` | StartIdea | Provider inquiry form |

---

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Kubernetes health probe |
| GET | `/api/health` | API service health |
| GET | `/api/placements` | Get all placements |
| POST | `/api/placements` | Create placement |
| GET | `/api/placement-requests` | Get all requests |
| POST | `/api/placement-requests` | Submit request |
| GET | `/api/provider-inquiries` | Get inquiries |
| POST | `/api/provider-inquiries` | Submit inquiry |

---

## Organization Type Routing
**Providers** (route to `/provider-dashboard`):
- AFL_PROVIDER, INDEPENDENT_HOME_PROVIDER, GROUP_HOME, TRANSITIONAL_HOUSING, RESPITE_PROVIDER

**Requestors** (route to `/requestor-dashboard`):
- HOMELESS_SHELTER, DOMESTIC_VIOLENCE_SHELTER, VETERANS_SHELTER, REENTRY_PROGRAM, PRISON_REENTRY, HALFWAY_HOUSE, PROBATION_PAROLE
- BEHAVIORAL_HEALTH_AGENCY, CASE_MANAGEMENT_AGENCY, HOSPITAL_DISCHARGE_PLANNER, NONPROFIT_ORGANIZATION, FAITH_BASED_ORG
- VETERAN_SELF, FAMILY_MEMBER, SELF_REFERRAL

---

## Next Action Items
1. **P2**: Placement Request Board enhancements (Request to Connect, agency notifications)
2. Dynamic placement forms using `placementSchemas.js`
3. Integrate MATCH_FLAGS matching logic into placement search
4. Add user authentication system
5. Build provider-request communication flow

## Future/Backlog
- "Become a Provider" guide
- Provider readiness check feature
- Multi-state credentialing support
- Match scoring for ranking placements
- Admin email digest configuration
- Automatic email notifications for Script B closures (Phase 2)
