---
description: How to safely modify the database schema with Prisma
---

1. **Preparation**
   - [ ] Ensure you are in `ops-api`.
   - [ ] `git checkout dev` && `git pull`.

2. **Schema Modification**
   - [ ] Edit `prisma/schema.prisma`.

3. **Migration**
   - [ ] Run migration dev command:
     ```bash
     npx prisma migrate dev --name <descriptive_name>
     ```
   - [ ] **Constraint**: Do NOT run `prisma db push` in development workflow.

4. **Verification**
   - [ ] Check migration SQL file in `prisma/migrations/`.
   - [ ] Run `npx prisma validate`.
   - [ ] Run `npm run build` to ensure generated client types are correct.

5. **Commit**
   - [ ] Commit BOTH `schema.prisma` and the new `migrations/` directory.
   - [ ] Commit message: `feat(db): <description>`
