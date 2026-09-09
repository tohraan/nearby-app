# AGENTS.md — Hackathon Collaboration & Git Workflow

## 0. ROLE

You are an AI software-development agent working as part of a multi-developer hackathon team.

This repository is actively being developed by multiple teammates using different IDEs and AI coding agents.

Your responsibility is to:

1. Understand the current state of the repository before making changes.
2. Keep your local workspace synchronized with the latest GitHub state.
3. Implement the requested feature/fix cleanly and safely.
4. Avoid interfering with other teammates’ work.
5. Commit your work with clear, atomic commits.
6. Push your work to a dedicated remote branch.
7. Open a Pull Request (PR) against the team’s designated integration branch.
8. Never directly modify or push to the protected integration branch unless explicitly instructed.

The GitHub repository is the source of truth.

---

## 1. REPOSITORY SOURCE OF TRUTH

Always treat the remote GitHub repository as authoritative.

Before beginning meaningful work:

```bash
git fetch --all --prune
git status
git branch -a
git log --oneline --decorate -10
```

Determine:

* Current branch
* Remote branch
* Whether the local branch is behind/ahead
* Whether there are uncommitted changes
* Whether teammates have recently pushed changes
* Whether the requested feature already exists
* Whether another teammate is already modifying the same area

Do NOT blindly overwrite existing work.

Before implementing anything, inspect the relevant code and understand the existing architecture.

---

## 2. REMOTE-FIRST DEVELOPMENT

At the beginning of EVERY task:

```bash
git fetch origin
```

Then inspect the remote state:

```bash
git status
git log --oneline --all --decorate -15
git branch -a
```

If the current branch is behind its upstream branch, synchronize it before starting work.

If there are remote changes that could affect the requested feature, inspect them first.

Never assume that the repository is unchanged simply because the local workspace has not changed.

---

## 3. NEVER WORK DIRECTLY ON MAIN

The integration branch is normally:

`main`

Unless the repository explicitly uses another integration branch.

You MUST NOT:

* Commit directly to `main`
* Push directly to `main`
* Force-push `main`
* Reset `main`
* Delete `main`
* Rewrite shared branch history

Every feature, bug fix, refactor, UI change, or experiment must happen on a dedicated branch.

---

## 4. CREATE A DEDICATED FEATURE BRANCH

Before beginning implementation, create or switch to a dedicated branch.

Preferred naming convention:

`feature/<short-description>`

Examples:

- `feature/location-map`
- `feature/chatbot-itinerary`
- `feature/activity-discovery`
- `feature/push-notifications`

For bugs:

`fix/<short-description>`

Examples:

- `fix/map-scroll`
- `fix/image-loading`
- `fix/mobile-layout`

For refactors:

`refactor/<short-description>`

If a branch already exists for the task, use it rather than creating a duplicate.

---

## 5. BEFORE CREATING A BRANCH

First synchronize the integration branch:

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
```

Then create the feature branch:

```bash
git checkout -b feature/<short-description>
```

If local uncommitted changes already exist, DO NOT discard them.

First inspect:

```bash
git status
git diff
```

Preserve the user’s work.

Never use destructive commands such as:

- `git reset --hard`
- `git clean -fd`
- `git checkout .`

unless the user explicitly requests it.

---

## 6. CHECK FOR OTHER TEAMMATE WORK

Because multiple AI agents may be working simultaneously, always assume another developer may be touching the same repository.

Before implementing a substantial feature, inspect:

```bash
git branch -a
git log --all --oneline --decorate -20
```

If relevant remote branches exist, inspect their recent commits.

Do not modify another teammate’s branch.
Do not delete another teammate’s branch.
Do not cherry-pick another teammate’s commits unless explicitly instructed.

If you discover overlapping work, prefer integrating with the existing implementation rather than creating competing implementations.

---

## 7. UNDERSTAND BEFORE MODIFYING

Before changing code:

1. Inspect the relevant files.
2. Understand existing components.
3. Understand the data flow.
4. Understand API interactions.
5. Understand state management.
6. Understand authentication/authorization.
7. Understand styling/design conventions.
8. Check whether similar functionality already exists.

Search the repository before creating new utilities, components, hooks, APIs, database models, or services.

Prefer extending existing architecture over introducing unnecessary parallel systems.

---

## 8. FOLLOW EXISTING PROJECT CONVENTIONS

Before writing code, inspect:

- `package.json`
- `README.md`
- `.env.example`
- `tsconfig.json`
- `next.config.*`
- `tailwind.config.*`
- `src/`
- `app/`
- `components/`
- `lib/`
- `supabase/`

Adapt to whatever structure actually exists.

Do not introduce a new framework, library, database, architecture, or dependency unless there is a strong reason.

If a dependency is required:

1. Check whether an existing dependency already solves the problem.
2. Prefer the existing stack.
3. Add the smallest dependency necessary.
4. Explain the dependency in the PR.

---

## 9. KEEP CHANGES SCOPED

Implement only what is required for the task.

Avoid unrelated:

* Refactors
* Formatting changes
* Dependency upgrades
* File reorganizations
* Renaming
* Architecture rewrites
* Design changes

unless they are necessary for the requested feature.

The goal is to make PRs:

* Easy to review
* Easy to test
* Easy to merge
* Easy to revert

---

## 10. PROTECT EXISTING FUNCTIONALITY

Before changing existing functionality, determine:

- What currently works?
- What does the user expect?
- What depends on this code?
- What could this change break?

Do not remove functionality simply because you would design it differently.

Maintain backwards compatibility whenever reasonably possible.

If an existing feature must change, ensure all dependent components are updated.

---

## 11. LOCAL DEVELOPMENT

After implementation, run the project’s appropriate validation commands.

Determine available scripts from:

`package.json`

Typical commands may include:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test`

Only run commands that actually exist in the repository.

Fix errors introduced by your changes.

Do not ignore TypeScript, lint, build, or test failures.

---

## 12. TEST THE ACTUAL FEATURE

Do not consider the task complete simply because the code compiles.

Verify the requested functionality.

For UI work, verify:

* Desktop layout
* Mobile layout
* Loading states
* Empty states
* Error states
* Hover states
* Click interactions
* Navigation
* Scrolling
* Images
* Forms
* API responses

For backend/API work, verify:

* Valid requests
* Invalid requests
* Error handling
* Authentication
* Database interactions
* Environment variables
* Response format

For integrations, verify the integration actually works rather than assuming it does.

---

## 13. ENVIRONMENT VARIABLES & SECRETS

NEVER commit:

- `.env`
- `.env.local`
- API keys
- access tokens
- private keys
- passwords
- credentials
- service-role keys

Only commit safe templates such as:

- `.env.example`

If a required environment variable is missing, clearly report it.

Do not invent credentials.

---

## 14. REVIEW YOUR OWN DIFF

Before committing:

```bash
git status
git diff
```

Review the complete change.

Ask:

* Did I modify anything unrelated?
* Did I accidentally remove functionality?
* Did I introduce debugging code?
* Did I leave console logs?
* Did I expose secrets?
* Did I create unnecessary dependencies?
* Did I modify files belonging to another feature?
* Does the implementation follow the existing architecture?

If unnecessary changes exist, remove them.

---

## 15. COMMIT ATOMICALLY

Commits should represent logical units of work.

Good:

- `feat: add nearby activity discovery`
- `fix: prevent map scroll interception`
- `ui: improve mobile activity cards`

Bad:

- `changes`
- `updates`
- `stuff`
- `final`
- `test`
- `asdf`

Use conventional commit style where possible:

`feat:`, `fix:`, `ui:`, `refactor:`, `docs:`, `chore:`, `perf:`, `test:`

Do not create dozens of meaningless commits.

---

## 16. BEFORE PUSHING

Before pushing, synchronize with the remote repository again:

```bash
git fetch origin
```

Check:

```bash
git status
git log --oneline --decorate -10
```

Determine whether the integration branch has changed since your work began.

If your branch needs to incorporate the latest integration-branch changes, do so carefully.

Preferred approach:

```bash
git fetch origin
git rebase origin/main
```

Resolve conflicts carefully.

NEVER automatically choose one side of a conflict without understanding it.

After resolving conflicts:

```bash
git status
```

Then rerun relevant tests/build/lint checks.

---

## 17. PUSH TO YOUR OWN REMOTE BRANCH

Push ONLY your feature branch.

Example:

```bash
git push -u origin feature/<short-description>
```

NEVER:

```bash
git push origin main
```

NEVER force-push shared branches.

Avoid:

```bash
git push --force
```

If force-pushing your own feature branch becomes absolutely necessary after a rebase, use:

```bash
git push --force-with-lease
```

Never use plain `--force`.

---

## 18. CREATE A PULL REQUEST

After successfully pushing the feature branch, create a Pull Request targeting:

`main`

The PR should contain:

### Title
A concise description of the feature.

Example: `feat: add nearby activity discovery`

### Description
Include:

```markdown
## What changed
- Added nearby activity discovery
- Added location-aware activity cards
- Added map interaction
- Added empty/loading states

## Why
Explains the user/problem this solves.

## Testing
- npm run lint
- npm run build
- Manual mobile testing
- Manual desktop testing

## Notes
Mention anything the reviewer should know.
```

---

## 19. PR OWNERSHIP

The person who created the feature branch owns the implementation.

The PR should be written so another teammate can understand:

* What changed
* Why it changed
* Where it changed
* How to test it
* What remains
* Whether there are known limitations

Do not create a PR that simply says: `updated stuff`.

---

## 20. AFTER OPENING THE PR

Once the PR is created:

DO NOT continue making unrelated changes on that branch.

If review feedback is provided, make the requested changes on the same branch.

Then:

```bash
git add .
git commit -m "fix: address PR feedback"
git push
```

The existing PR should update automatically.

Do not create a second PR for the same feature unless explicitly instructed.

---

## 21. KEEPING UP WITH GITHUB

Because teammates and AI agents are continuously pushing changes, periodically refresh repository state during long tasks:

```bash
git fetch --all --prune
```

Especially do this:

* Before starting a task
* Before creating a branch
* Before committing
* Before pushing
* After a long implementation session
* Before opening a PR
* When resolving conflicts

If the task takes a long time, do not assume your starting snapshot is still current.

---

## 22. NEVER OVERWRITE TEAMMATE WORK

If you encounter changes you did not create:

STOP and inspect them.

Use:

```bash
git status
git diff
git log
```

Determine whether the changes are:

* User changes
* Teammate changes
* Existing repository changes
* Generated files
* Build artifacts

Never discard them simply to make your task easier.

If uncertain, ask the developer.

---

## 23. VERCEL DEPLOYMENT AWARENESS

The project may be deployed through Vercel.

Treat deployments as part of the development workflow.

After significant changes, verify that:

* The application builds successfully.
* Production-only environment variables are not accidentally changed.
* Client/server boundaries remain valid.
* Routes do not break.
* Static assets load.
* Images load.
* API calls behave correctly.
* No development-only URLs are hardcoded.

Do not modify Vercel configuration unless required.

Do not expose deployment secrets.

---

## 24. DATABASE SAFETY

If the project uses Supabase/PostgreSQL or another database:

NEVER casually modify production data.

Before changing:

* Database schema
* Tables
* Columns
* RLS policies
* Functions
* Triggers
* Migrations

inspect the existing implementation first.

Prefer migrations over destructive schema changes.

Never drop production tables/data unless explicitly authorized.

---

## 25. AI AGENT BEHAVIOR

You are not working in isolation.

Assume:

- Other AI agents are coding simultaneously.
- Humans may be editing the repository simultaneously.
- GitHub may change while you are working.
- The Vercel deployment may change after another merge.

Therefore:

- Always inspect before modifying.
- Always synchronize before pushing.
- Always review your diff before committing.
- Always use a feature branch.
- Always create a PR for review.

---

## 26. TASK EXECUTION LOOP

For every task, follow this exact lifecycle:

```text
1. FETCH
   ↓
2. INSPECT REPOSITORY
   ↓
3. CHECK BRANCH / WORKTREE
   ↓
4. UNDERSTAND EXISTING IMPLEMENTATION
   ↓
5. CREATE FEATURE BRANCH
   ↓
6. IMPLEMENT
   ↓
7. TEST
   ↓
8. REVIEW DIFF
   ↓
9. FETCH AGAIN
   ↓
10. REBASE/UPDATE IF NECESSARY
   ↓
11. TEST AGAIN
   ↓
12. COMMIT
   ↓
13. PUSH FEATURE BRANCH
   ↓
14. OPEN PR → main
   ↓
15. WAIT FOR REVIEW
   ↓
16. ADDRESS FEEDBACK
   ↓
17. PUSH UPDATES
   ↓
18. OWNER MERGES PR
```

---

## 27. DEFINITION OF DONE

A task is NOT considered complete when the code has merely been written.

A task is complete only when:

* Feature implemented
* Existing functionality preserved
* Code follows repository conventions
* Relevant tests/checks pass
* Build passes when applicable
* No secrets committed
* Diff reviewed
* Latest remote state checked
* Feature branch pushed
* Pull Request created
* PR targets `main`
* PR description explains the changes
* Reviewer can reproduce/test the feature

---

## 28. CRITICAL RULES

These rules override convenience:

- **RULE 1**: NEVER push directly to `main`.
- **RULE 2**: NEVER delete or overwrite another developer’s work.
- **RULE 3**: NEVER commit secrets.
- **RULE 4**: NEVER blindly resolve merge conflicts.
- **RULE 5**: NEVER assume GitHub is unchanged. Fetch regularly.
- **RULE 6**: NEVER create a duplicate implementation without checking the repository first.
- **RULE 7**: NEVER consider “code written” equivalent to “feature complete.”
- **RULE 8**: Every completed feature should end as a Pull Request for review.

---

## 29. DEFAULT COMMAND WORKFLOW

When starting a new task:

```bash
git fetch --all --prune
git status
git branch -a
git log --oneline --decorate -15
git checkout main
git pull --ff-only origin main
git checkout -b feature/<short-description>
```

After implementation:

```bash
git status
git diff
npm run lint
npm run build
git fetch origin
git rebase origin/main
git add .
git commit -m "feat: <description>"
git push -u origin feature/<short-description>
```

Finally: Create a Pull Request targeting `main`.

---

## 30. IMPORTANT: DO NOT STOP AT “I BUILT IT”

When the developer asks you to implement a feature, your job is not finished after editing files.

Your final responsibility is to move the work through the collaboration pipeline:

`CODE → TEST → COMMIT → PUSH → PR`

If the environment supports GitHub CLI, use it to create the PR.

For example:

```bash
gh pr create --base main --head <feature-branch>
```

If GitHub CLI is unavailable, push the branch and provide the exact PR URL/path or instruct the developer that the branch is ready for PR creation.

Do not claim that a PR was created unless the environment actually confirms that it was created.

---

## 31. FINAL RESPONSE AFTER COMPLETING A TASK

When the implementation is complete, report:

```markdown
## Implementation Complete
### Feature
<what was built>
### Branch
<feature branch>
### Commits
<commit hashes / messages>
### Validation
<tests/build/lint performed>
### Pull Request
<PR status/link if available>
### Notes
<any important limitations or reviewer notes>
```

Be concise.

The important thing is that the repository is left in a clean, reviewable state.

---

## OPERATING PRINCIPLE

- GitHub is the source of truth.
- Branches isolate work.
- Commits explain work.
- Pull Requests review work.
- Only reviewed work reaches `main`.

Follow this protocol throughout the entire development session.
