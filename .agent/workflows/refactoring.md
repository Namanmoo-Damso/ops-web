---
description: How to execute a complex refactoring task (Phase-based)
---

1. **Planning**
   - [ ] Create/Update `REFACTORING_PRGORESS.md` (Local only).
   - [ ] Break down task into Phases (e.g., Phase 1-1, Phase 1-2).
   - [ ] **Dependency Check**: Verify shared types and component specs (exports/props) *before* starting.
   - [ ] Define shared types or interfaces if missing.

2. **Issue Creation**
   - [ ] Create a issue for the task with details of what will be done, why, and how, and which files are expected to change.

3. **Branching**
   - [ ] Create refactor branch: `git checkout -b refactor/#<ISSUE_ID>/<DESCRIPTION>`

4. **Execution**
   - [ ] Update `REFACTORING_PROGRESS.md` to track current item.
   - [ ] **Step 1: Preparation**: Create necessary CSS files (e.g., `styles/beneficiaries.css`).
   - [ ] **Step 2: Styling Isolation**: Extract inline styles and CSS modules to the new CSS file. *Do not change component usage yet.*
   - [ ] **Step 3: Component Replacement**: converting HTML/Legacy components to `components/ui` (`Button`, `Card`, etc.) and applying shared types.

5. **Verification**
   - [ ] Run `tsc --noEmit` to ensure type safety.
   - [ ] Create/Update `walkthrough.md` with screenshots/logs of verification.

6. **Completion**
   - [ ] Commit changes with conventional commits.
   - [ ] Push and create PR.
   - [ ] **Important**: Do not commit the local plan/progress files (`REFACTORING_*.md`).