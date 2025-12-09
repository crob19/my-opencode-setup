---
description: Create PR with AI description
---

Create a pull request for the current branch against main.

Branch comparison:
!`git diff $(git merge-base HEAD main)...HEAD`

Commit history:
!`git log --oneline $(git merge-base HEAD main)..HEAD`

Generate a comprehensive PR description with:
- Summary of changes (what was done)
- Motivation (why these changes were made)
- Type of change (feature/bugfix/refactor/docs/test)
- Testing done
- Any breaking changes or migration notes

Then create the PR using: gh pr create --title "TITLE" --body "DESCRIPTION"
