---
description: How to develop a new feature from start to finish
---

1. **Setup**
   - [ ] Check out the `dev` branch: `git checkout dev`
   - [ ] Pull latest changes: `git pull origin dev`

2. **Issue Creation**
   - [ ] Create a issue for the task with details of what we'll be done, why, and how, which files are expected to change.

3. **Branching**
   - [ ] Create a feature branch: `git checkout -b feature/#<ISSUE_ID>/<DESCRIPTION>`

4. **Development**
   - [ ] Implement changes.
   - [ ] Follow `collab-rules.md` for styling and coding standards.

5. **Verification**
   - [ ] Run type check: `tsc --noEmit` (web) or build check (api).
   - [ ] Verify local functionality.

6. **Commit**
   - [ ] Stage changes: `git add .`
   - [ ] Commit with convention: `git commit -m "feat(scope): description"`

7. **Push & PR**
   // turbo
   - [ ] Push to remote: `git push -u origin feature/#<ISSUE_ID>/<DESCRIPTION>`
   - [ ] Create Pull Request targeting `dev`.