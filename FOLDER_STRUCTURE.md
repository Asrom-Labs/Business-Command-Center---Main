# BCC — Project Folder Structure
# Asrom Labs | Established: March 7, 2026

## Root: C:\Users\Ashraf Rusheidat\Desktop\Business Command Center\App\

App/
├── backend/                        ← All application source code (Node.js/Express)
│   ├── src/                        ← Controllers, routes, middleware, services
│   ├── db/                         ← schema.sql and migrations/
│   ├── .env                        ← Local environment variables (never commit)
│   ├── .env.example                ← Template for environment variables (safe to commit)
│   ├── package.json
│   └── server.js
│
├── docs/                           ← Permanent reference documents (architecture, specs, ERD)
│   ├── BCC_Architecture_Manual_V1.2.docx
│   ├── BCC_Technical_Specifications_V1.2.docx
│   └── Business_Command_Center_ERD_v1.2.sql
│
├── audit-reports/                  ← All audit, fix, and verification reports (read-only archive)
│   ├── AUDIT_ROUND_4.md
│   ├── FIXES_ROUND_4.md
│   ├── VERIFICATION_ROUND_4.md
│   ├── FINAL_FOCUSED_AUDIT.md
│   ├── FIXES_FINAL.md
│   ├── READY_FOR_TESTING.md
│   └── GITHUB_PUSH_CONFIRMED.md
│
├── logs/                           ← Living project logs (updated regularly)
│   ├── BCC_Bug_Fix_Log.md          ← All bugs found and fixed with version history
│   └── BCC_Project_Status.md      ← Master project plan and phase tracker
│
├── FOLDER_STRUCTURE.md             ← This file — defines where everything goes
└── README.md                       ← Project overview and quick-start guide

## Rules
1. New audit or verification report → audit-reports/
2. Bug fix or project status update → logs/
3. Architecture or spec document → docs/
4. Temporary session files → delete when session is done, never leave in root
5. Never commit .env — only .env.example is safe to commit
6. Never put report files in the root — root contains only README.md and FOLDER_STRUCTURE.md