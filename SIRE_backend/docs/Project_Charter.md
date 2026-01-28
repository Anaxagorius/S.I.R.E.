
# Project Charter — Incident Response Simulator

## 1. Project Overview
**Project Title:** Incident Response Simulator — Real‑Time Training Platform for Emergency Scenarios  
**Course / Sponsor:** PROG3300 Integrated Projects for Programming — Instructor: Alfred Parkes  
**Team:** Tom Burchell (Backend Architecture & Real‑Time), Leo Wasiliew (Frontend & UI/UX), John Hay (Scenario Content & Accessibility), Kael Payette (Project Coordination & Testing)  

## 2. Purpose and Justification
Create an accessible, multi‑user, real‑time simulator that lets an instructor conduct immersive emergency drills (e.g., active threat, fire, flood, hazardous materials) safely and repeatedly, improving preparedness and team decision‑making.

## 3. Objectives (SMART)
- Deliver a real‑time instructor‑led simulator where trainees join by session code and interact via a shared event log.  
- Support ≥10 concurrent trainees per session with sub‑300ms perceived update latency on LAN‑like conditions.  
- Provide eight scenario types with timed automatic escalations and live administrator injections.  
- Ship complete documentation, deployment artifacts, and a working demo instance by the project deadline.

## 4. Scope
**In Scope**  
- Full‑stack JavaScript solution (Node.js + Express, Socket.IO, React).  
- Real‑time rooms/sessions, admin dashboard, trainee interface, timed escalation logic.  
- Eight scenario definitions and evaluation rubric.  
- CI, containerization, and cloud deployment guides.  

**Out of Scope**  
- Native mobile apps, hardware sensors, paid SaaS integrations.

## 5. High‑Level Deliverables
- Operational simulator (backend + frontend) with eight scenarios.  
- Documentation set: README, API specification, Socket.IO event catalog, deployment guide, ADRs.  
- Demo assets (script and walkthrough).  

## 6. Roles & Responsibilities
- **Project Coordination (Kael Payette):** schedule, risk log, workflow, testing orchestration.  
- **Backend & Real‑Time (Tom Burchell):** Express API, Socket.IO server & protocol, session store, scenario escalation engine, deployment pipeline.  
- **Frontend & UX (Leo Wasiliew):** React app, state management, admin dashboard, trainee UI, responsive design.  
- **Scenario & Quality (John Hay):** scenario authoring, acceptance criteria, accessibility, integration testing.

## 7. Milestones & Timeline (12 weeks)
1) Weeks 1–2: requirements, repo & scaffolding; 2) Weeks 3–5: backend core; 3) Weeks 6–8: frontend; 4) Weeks 9–10: scenarios & integration; 5) Weeks 11–12: testing, docs, deployment.

## 8. Success Criteria
- Functional end‑to‑end live session with multiple trainees.  
- Stable real‑time synchronization under target load.  
- Positive evaluator feedback on usability and documentation.  

## 9. Constraints & Assumptions
- Zero‑cost tooling; use of free cloud tiers.  
- Single‑term delivery window; team availability aligned to academic schedule.

## 10. Risk Management (selected)
- **Real‑time drift:** early Socket.IO prototypes; idempotent events.  
- **Scope creep:** MVP control; backlog triage.  
- **Dependency conflicts:** lockfiles; pinned versions; CI.
