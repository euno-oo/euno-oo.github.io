# Git Sync Guide for Euno Project

This guide provides quick commands for syncing the Euno project between local and remote repositories. The project uses a single `main` branch for simplicity and team collaboration.

---

##  Table of Contents
1. [Local to Remote (Push Local Changes)](#local-to-remote-push-local-changes)
2. [Remote to Local (Pull Remote Changes)](#remote-to-local-pull-remote-changes)
3. [Full Sync (Both Directions)](#full-sync-both-directions)
4. [Repository Status](#repository-status)
5. [Important Notes](#important-notes)

---

##  Local to Remote (Push Local Changes)

Use this when you've made changes locally and want to upload them to GitHub.

### Quick Command (One-liner)
```bash
git add -A && git commit -m "Your commit message here" && git push origin main
```

### Step-by-Step Approach
```bash
# 1. Check status of your changes
git status

# 2. Stage all changes
git add -A

# 3. Commit with a descriptive message
git commit -m "Your commit message here"

# 4. Push to remote main branch
git push origin main

# 5. Verify push was successful
git log --oneline -3
```

### Examples
```bash
# Update styles and features
git add -A && git commit -m "Update: Improved UI styles and added new features" && git push origin main

# Bug fixes
git add -A && git commit -m "Fix: Resolved login form validation issues" && git push origin main

# Documentation updates
git add -A && git commit -m "Docs: Updated API documentation" && git push origin main
```

---

##  Remote to Local (Pull Remote Changes)

Use this when team members have pushed changes and you want to update your local files.

### Quick Command
```bash
git fetch origin && git reset --hard origin/main
```

### Step-by-Step Approach
```bash
# 1. Fetch latest changes from remote (without modifying local files)
git fetch origin

# 2. Check what would change
git diff HEAD origin/main

# 3. Pull changes (merge them with your work)
git pull origin main

# OR - Replace local with remote exactly (if you have no local changes to keep)
git reset --hard origin/main
```

### Safe Pull (If You Have Local Changes)
```bash
# 1. Commit your local changes first
git add -A && git commit -m "Your local changes"

# 2. Then pull remote changes
git pull origin main

# 3. If there are conflicts, resolve them and commit
git add . && git commit -m "Merge conflicts resolved"
```

---

##  Full Sync (Both Directions)

### Sync Local to Remote (Your Local is Source of Truth)
```bash
# Make sure you're on main branch
git checkout main

# Stage and commit all changes
git add -A && git commit -m "Sync local changes"

# Force push to remote (overwrites remote with local state)
git push -f origin main

# Clean up - update remote tracking info
git fetch origin
```

### Sync Remote to Local (Remote is Source of Truth)
```bash
# Make sure you're on main branch
git checkout main

# Fetch latest from remote
git fetch origin

# Reset local to match remote exactly
git reset --hard origin/main

# Clean up local untracked files (optional)
git clean -fd
```

---

##  Repository Status

### Check Current Status
```bash
# See what's changed
git status

# See all branches (local and remote)
git branch -a

# View commit history
git log --oneline -10

# Compare local vs remote
git diff origin/main
```

### Current Repository Info
- **Repository URL:** https://github.com/euno-oo/euno-oo.github.io.git
- **Active Branch:** main
- **Total Branches:** 1 (main only)
- **Default Branch:** main

---

##  Important Notes

### Rules for This Project
 **DO:**
- Always commit before pulling
- Use clear, descriptive commit messages
- Pull before starting new work
- Test changes locally before pushing
- Keep the main branch stable and production-ready

 **DON'T:**
- Create new branches (use main only)
- Force push unless specifically needed
- Commit without meaningful messages
- Push untested code to main
- Delete the main branch

### Commit Message Examples
```
"Fix: Resolved calendar display bug"
"Update: Improved dashboard performance"
"Add: New wellness tracking feature"
"Refactor: Simplified authentication logic"
"Docs: Added setup instructions"
```

### Troubleshooting

**Problem:** Changes not appearing after push
```bash
# Verify the push worked
git log --oneline -3
git push origin main -v
```

**Problem:** Local changes conflict with remote
```bash
# Option 1: Keep your changes
git add . && git commit -m "Your changes" && git push origin main

# Option 2: Keep remote changes
git fetch origin && git reset --hard origin/main
```

**Problem:** Accidentally modified files locally
```bash
# Restore to remote version
git restore <filename>

# Or restore all files
git restore .
```

---

##  Quick Reference Card

```
PUSH (Local → Remote):
$ git add -A && git commit -m "message" && git push origin main

PULL (Remote → Local):
$ git fetch origin && git reset --hard origin/main

CHECK STATUS:
$ git status
$ git log --oneline -5

SEE BRANCHES:
$ git branch -a

UNDO CHANGES:
$ git restore <filename>
$ git restore .
```

---

**Last Updated:** 2026-06-13
**Maintained by:** Team
**For Questions:** Refer to this guide or ask the project lead
