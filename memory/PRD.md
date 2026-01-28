# AnchorPoint Compliance Toolkit - PRD

## Original Problem Statement
Build a Non-PHI Operational Compliance Management web app for Peer Support Agencies. The application manages policies, staff records, training, supervision logs, incident reports, emergency logs, and on-call assignments without storing Protected Health Information (PHI).

## User Personas
- **Administrator**: Full system access, manages users, policies, staff, and generates reports
- **Qualified Professional (QP)**: Logs supervision sessions, reviews incidents, view-only for most data
- **Staff**: Read-only access to policies, can submit incident/emergency reports, must acknowledge policies

## Core Requirements

### Authentication & Authorization
- [x] JWT-based authentication
- [x] Role-based access control (Admin, QP, Staff)
- [x] Protected routes by role

### Non-PHI Compliance
- [x] Persistent warning banner on all pages
- [x] Client references limited to initials or non-identifying IDs
- [x] No storage of full names, SSN, DOB, addresses, or Medicaid IDs

### Core Modules (All Complete)
1. [x] **Policy & Procedure Vault** - Upload, version control, acknowledgements
2. [x] **Staff Management** - CRUD operations, compliance status tracking
3. [x] **Training Records** - Required training matrix, completion tracking
4. [x] **QP Supervision Logs** - Session documentation with topics and notes
5. [x] **Incident Reports** - Non-PHI incident logging with status workflow
6. [x] **Emergency Coverage Logs** - Emergency response documentation
7. [x] **On-Call Assignments** - Calendar-based scheduling
8. [x] **Reports & Exports** - PDF and CSV exports
9. [x] **User Management** - Role changes, user list

### Phase 2 Features (Complete)
1. [x] **PDF Export Enhancement**
   - Formatted PDF reports for incidents, supervision, compliance, emergency
   - NON-PHI banner on all PDF reports
   - Summary statistics and detailed records
   - Date range filtering

2. [x] **File Upload for Policies**
   - Secure document storage (PDF, DOC, DOCX, TXT, RTF)
   - File preview and download
   - Document versioning
   - 10MB file size limit

3. [x] **Audit Trail**
   - Track changes to staff and incidents
   - View modification history with before/after values
   - Summary dashboard with activity stats
   - Filter by entity type, action, date range

## Technical Architecture

### Backend (FastAPI + Python)
- `/app/backend/server.py` - Main API server
- MongoDB database with collections:
  - users, policy_documents, policy_acknowledgements
  - staff_members, training_records, qp_profiles
  - supervision_logs, incident_reports, emergency_logs
  - oncall_assignments, audit_logs
- PDF generation with ReportLab
- File storage in `/app/backend/uploads/policies/`

### Frontend (React + Shadcn UI)
- `/app/frontend/src/App.js` - Main router
- `/app/frontend/src/components/Layout.jsx` - Sidebar navigation
- `/app/frontend/src/context/AuthContext.jsx` - Auth state management
- 12 pages: Login, Dashboard, Policies, Staff, Training, Supervision, Incidents, Emergency, OnCall, Reports, Audit, Users

## API Endpoints

### Authentication
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- GET `/api/auth/me` - Get current user

### Policies
- GET/POST `/api/policies` - List/create policies
- POST `/api/policies/upload` - Upload policy file
- GET `/api/policies/files/{filename}` - Download policy file
- GET `/api/policies/{id}/versions` - Get version history
- POST `/api/policies/{id}/acknowledge` - Acknowledge policy

### Staff & Training
- GET/POST/PUT/DELETE `/api/staff` - Staff CRUD
- GET/POST/PUT `/api/training` - Training records

### Logs
- GET/POST `/api/supervision-logs` - QP supervision
- GET/POST/PUT `/api/incidents` - Incident reports
- GET/POST `/api/emergency-logs` - Emergency logs
- GET/POST/DELETE `/api/oncall` - On-call assignments

### Reports
- GET `/api/reports/pdf/incidents` - Incidents PDF
- GET `/api/reports/pdf/supervision` - Supervision PDF
- GET `/api/reports/pdf/compliance` - Compliance PDF
- GET `/api/reports/pdf/emergency` - Emergency PDF
- GET `/api/reports/{type}` - JSON/CSV exports

### Audit
- GET `/api/audit-logs` - Get audit logs with filters
- GET `/api/audit-logs/recent` - Get recent activity
- GET `/api/audit-logs/summary` - Get activity summary
- GET `/api/audit-logs/entity/{type}/{id}` - Get entity history

## Test Credentials
- Admin: `admin@test.com` / `Admin123!`

## What's Complete
- [x] MVP with all 9 core modules (Jan 28, 2025)
- [x] PDF Export Enhancement (Jan 28, 2025)
- [x] File Upload for Policies (Jan 28, 2025)
- [x] Audit Trail System (Jan 28, 2025)

## Backlog (Future Phases)
- [ ] Notification System (policy acknowledgement reminders, training alerts)
- [ ] Advanced Dashboard (charts, compliance metrics)
- [ ] Design Refinements (dark mode, custom branding)
- [ ] Email integration for alerts
- [ ] Mobile-responsive improvements
