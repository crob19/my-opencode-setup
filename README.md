# My OpenCode Setup

Personal OpenCode commands, custom agents, and plugins for enhanced development workflow across Python, TypeScript, and Terraform projects.

## Overview

This repository contains:
- **16 Custom Commands** organized into 6 categories
- **1 Custom Agent** for controlled development workflow
- **1 Plugin** for enhanced functionality
- **1 Custom Tool** for direct execution

### Commands
- **Git Worktree Management** (6 commands)
- **PR & Git Workflows** (4 commands)
- **Code Quality & Analysis** (4 commands) 
- **Testing** (2 commands)
- **Refactoring** (3 commands)
- **Debugging** (2 commands)
- **Utilities** (1 command)

### Agents
- **build-ask**: Full build mode that requests permission before making edits

### Plugins
- **notifications**: macOS notifications for permission requests and session completion

### Tools
- **copilot-usage**: Check GitHub Copilot billing and usage

## Tech Stack

These commands are optimized for:
- **Python**: pytest, uv, ruff, pyright
- **TypeScript**: vitest, eslint + prettier, yarn, Node.js
- **Terraform**: Infrastructure as Code
- **Version Control**: GitHub (via `gh` CLI)

## Prerequisites

- [OpenCode](https://opencode.ai) installed
- [GitHub CLI](https://cli.github.com/) (`gh`) for PR commands
- Language-specific tools installed in your projects

## Installation

### Quick Install (Symlink - Recommended)

Symlinks allow automatic updates when you pull changes:

```bash
git clone git@github.com:cameronclippd/my-opencode-setup.git ~/my-opencode-setup
cd ~/my-opencode-setup
./install.sh
```

This installs:
- Commands to `~/.config/opencode/command/`
- Agents to `~/.config/opencode/agent/`
- Plugins to `~/.config/opencode/plugin/`

### Manual Installation

```bash
# Clone the repository
git clone git@github.com:cameronclippd/my-opencode-setup.git ~/my-opencode-setup

# Create symlinks for commands
ln -sf ~/my-opencode-setup/commands/* ~/.config/opencode/command/

# Create symlinks for agents
ln -sf ~/my-opencode-setup/agents/* ~/.config/opencode/agent/

# Create symlinks for plugins
ln -sf ~/my-opencode-setup/plugins/* ~/.config/opencode/plugin/
```

### Updates

If installed with symlinks:
```bash
cd ~/my-opencode-setup
git pull
./install.sh  # Re-run to ensure all symlinks are current
```

## Commands Reference

### Git Worktree Management

Git worktrees allow you to work on multiple branches simultaneously without switching contexts. All worktrees are created in `.opencode-wt/` directory.

#### `/worktree-add`
Creates a new git worktree for parallel development.
- Automatically creates worktrees in `.opencode-wt/<branch-name>`
- Smart branch detection (local/remote/new)
- Auto-configures `.gitignore`
- Automatically opens new OpenCode session in worktree

**Usage:** 
- `/worktree-add feature-auth` - Create new branch from current HEAD
- `/worktree-add feature-api --from main` - Create from specific branch
- `/worktree-add experiment --no-open` - Create without opening session

#### `/worktree-list`
Lists all active worktrees with their current branch and status.
- Shows main and linked worktrees
- Highlights current worktree
- Displays branch names and commit hashes

**Usage:** `/worktree-list`

#### `/worktree-remove`
Removes a worktree and optionally deletes the branch.
- Validates no uncommitted changes
- Prevents removing main worktree
- Option to delete branch after removal

**Usage:** 
- `/worktree-remove feature-auth`
- `/worktree-remove old-feature --delete-branch`
- `/worktree-remove stale --force` - Force removal with uncommitted changes

#### `/worktree-switch`
Opens an OpenCode session in a different worktree.
- Lists available worktrees if no argument provided
- Automatically launches OpenCode in selected worktree

**Usage:** 
- `/worktree-switch` - Show available worktrees
- `/worktree-switch feature-api` - Switch to specific worktree

#### `/worktree-status`
Shows detailed status of all worktrees including uncommitted changes and remote sync status.
- Displays working directory status (clean/modified)
- Shows commits ahead/behind remote
- Lists last commit message and time
- Summary of clean vs dirty worktrees

**Usage:** `/worktree-status`

#### `/worktree-sync`
Fetches from remote and shows which worktrees have updates available.
- Runs `git fetch origin`
- Shows which worktrees are behind remote
- Optionally pulls updates in all worktrees

**Usage:** 
- `/worktree-sync` - Fetch and show status
- `/worktree-sync --pull` - Fetch and auto-pull in all worktrees

---

### PR & Git Workflows

#### `/pr-create`
Creates a pull request with AI-generated description.
- Analyzes branch changes vs main
- Generates comprehensive PR description
- Creates PR via `gh pr create`

**Usage:** `/pr-create`

#### `/pr-address-comments`
Fetches and addresses unresolved PR comments.
- Pulls all review comments
- Makes requested code changes
- Suggests responses for reviewers

**Usage:** `/pr-address-comments 123` (where 123 is the PR number)

#### `/commit-smart`
Generates conventional commit messages from staged changes.
- Analyzes `git diff --staged`
- Suggests type (feat/fix/docs/refactor/etc.)
- Explains reasoning

**Usage:** `/commit-smart`

#### `/review-changes`
Reviews uncommitted changes for quality issues before committing.
- Checks for bugs, security issues
- Identifies code quality problems
- Suggests improvements

**Usage:** `/review-changes`

---

### Code Quality & Analysis

#### `/doc-function`
Generates comprehensive documentation for functions/classes.
- Python: Google-style docstrings
- TypeScript: JSDoc comments
- Includes examples and edge cases

**Usage:** `/doc-function src/utils.py`

#### `/explain-code`
Explains code in plain English with step-by-step breakdown.

**Usage:** `/explain-code src/api.ts`

#### `/security-check`
Performs security audit on code.
- SQL injection, XSS, command injection
- Hardcoded secrets
- Auth/authorization issues
- Language-specific vulnerabilities

**Usage:** `/security-check src/auth.py`

#### `/perf-analyze`
Analyzes code for performance issues.
- Python: N+1 queries, blocking I/O, memory leaks
- TypeScript: Unnecessary re-renders, bundle size
- Terraform: Over-provisioning

**Usage:** `/perf-analyze src/components/Dashboard.tsx`

---

### Testing

#### `/test-gen`
Generates comprehensive tests (pytest for Python, vitest for TypeScript).
- Happy path and edge cases
- Error handling
- Mocking external dependencies

**Usage:** `/test-gen src/calculator.py`

#### `/test-fix`
Runs tests, analyzes failures, and suggests fixes.
- Identifies root causes
- Fixes issues
- Re-runs tests to verify

**Usage:** `/test-fix`

---

### Refactoring

#### `/simplify`
Refactors complex code to be simpler and more readable.
- Reduces cognitive complexity
- Improves naming
- Follows best practices

**Usage:** `/simplify src/complex_logic.py`

#### `/type-improve`
Improves type annotations.
- Python: Adds type hints, fixes pyright errors
- TypeScript: Replaces `any`, adds proper types

**Usage:** `/type-improve src/api.ts`

#### `/extract-util`
Extracts repeated code into reusable utility functions.
- Creates well-named utilities
- Updates all call sites
- Adds documentation

**Usage:** `/extract-util "extract the validation logic from auth handlers"`

---

### Debugging

#### `/trace-bug`
Traces bugs through the codebase to find root cause.
- Analyzes error messages
- Follows execution path
- Suggests fixes with file locations

**Usage:** `/trace-bug "TypeError: cannot read property 'id' of undefined"`

#### `/debug-logs`
Analyzes error logs and stack traces to suggest fixes.
- Parses error types
- Identifies root cause
- Provides prevention strategies

**Usage:** `/debug-logs "paste error output here"`

---

### Utilities

#### `/copilot-usage`
Check your GitHub Copilot billing usage and costs. This command uses a custom tool for fast, direct execution without AI agent overhead.

**Usage:** 
- `/copilot-usage` - Auto-detect account from git remote
- `/copilot-usage personal` - Check personal account
- `/copilot-usage <org-name>` - Check specific organization
- Add `--month <M> --year <YYYY>` for historical data
- Add `--verbose` for detailed breakdown

See the [copilot-usage tool](#copilot-usage-1) section for full details.

---


## Plugins

### `notifications`
Sends native macOS notifications for OpenCode events to keep you informed when you're working in other applications.

**Features:**
- **Permission requests**: Get notified when an agent needs approval for edits or bash commands
- **Session completion**: Get notified when the agent finishes working
- **Error alerts**: Get notified if an error occurs during a session
- Uses native macOS notification center with sound alerts

**Requirements:**
- macOS (uses `osascript` for notifications)
- Automatically loaded by OpenCode on startup

**Notification Events:**
- `permission.updated` - Agent requesting permission (Glass sound)
- `session.idle` - Agent finished working (Glass sound)
- `session.error` - Error occurred (Basso sound)

**Usage:**
Once installed, the plugin automatically runs in the background. No configuration needed!

---

## Tools

### `copilot-usage`
A custom tool that provides fast, direct access to GitHub Copilot billing and usage information without AI agent overhead.

**Features:**
- **Zero AI inference cost** - Runs as a direct tool, not through the agent
- **Fast execution** - Direct API calls to GitHub
- **Auto-detection** - Automatically detects org context from git remote
- **Comprehensive data** - Shows seat allocation, usage metrics, and costs
- **Historical queries** - Optional month/year parameters for past data
- **Verbose mode** - Detailed SKU and pricing breakdown when needed

**What it shows:**
- Current billing period
- Copilot usage breakdown (seats, completions, etc.)
- Premium request usage (advanced models like GPT-4)
- Costs with discounts applied
- For orgs: seat allocation, active/inactive seats, plan type

**Command usage:**
- `/copilot-usage` - Auto-detect account from git remote
- `/copilot-usage personal` - Check personal account
- `/copilot-usage my-org` - Check specific organization
- `/copilot-usage --month 11 --year 2024` - Historical data
- `/copilot-usage --verbose` - Detailed breakdown

**Requirements:**
- GitHub CLI with appropriate scopes:
  - Personal: `gh auth refresh -h github.com -s user`
  - Organization: `gh auth refresh -h github.com -s admin:org`
- Tool automatically loaded by OpenCode on startup

---

## Custom Agents

### `build-ask`
A primary agent that provides full build mode capabilities but requests permission before making any edits.

**Features:**
- All tools enabled (read, write, edit, bash, etc.)
- Asks for permission before file edits or modifications
- Safe bash commands pre-approved (git status, ls, cat, etc.)
- All other bash commands require approval
- Transparent about changes with clear explanations

**Usage:**
- Press **Tab** to cycle between agents: `build` → `plan` → `build-ask`
- Or invoke directly: `@build-ask`

**When to use:**
- When you want full development assistance with safety guardrails
- Reviewing changes before they're made
- Working on sensitive code that requires careful oversight
- Learning what OpenCode is doing behind the scenes

**Pre-approved commands:**
- `git status`, `git diff*`, `git log*`, `git branch*`, `git show*`
- `ls*`, `cat*`, `pwd`, `echo*`
- `which*`, version checks (`node --version`, etc.)

---

## Configuration

### Model Selection
Commands use your currently selected model in OpenCode. No model override specified, so you have full flexibility.

### Agent Selection
Commands use your current agent (build/plan/build-ask). No agent override specified.

## Tips

- **Commands**: Use `/` in OpenCode TUI to see all available commands
- **Agents**: Press **Tab** to cycle through agents, or use `@agent-name`
- **Plugins**: Automatically loaded on OpenCode startup - check console for initialization messages
- Commands are language-aware (detect .py, .ts, .tf extensions)
- PR commands require GitHub CLI authentication: `gh auth login`
- **Notification plugin pairs perfectly with build-ask agent** - get notified when permission is needed!

## Customization

Feel free to modify commands in `commands/` to fit your workflow:
1. Edit the markdown files directly
2. Adjust prompts, add project-specific instructions
3. Commit and push changes

## License

MIT License - See [LICENSE](LICENSE) for details.
