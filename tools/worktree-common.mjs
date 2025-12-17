#!/usr/bin/env node

/**
 * Git Worktree Common Utilities
 * 
 * Shared functions and constants for worktree management
 */

import { $ } from "bun";

// Constants
export const WORKTREE_DIR = ".opencode-wt";

// Colors
export const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

/**
 * Get the git repository root directory
 */
export async function getRepoRoot() {
  try {
    const root = await $`git rev-parse --show-toplevel`.text();
    return root.trim();
  } catch (error) {
    console.error(`${colors.red}❌ Error: Not in a git repository${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Check if currently in a git repository
 */
export async function checkGitRepo() {
  try {
    await $`git rev-parse --git-dir`.quiet();
    return true;
  } catch {
    console.error(`${colors.red}❌ Error: Not in a git repository${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Get the worktree base directory path
 */
export function getWorktreeBase(repoRoot) {
  return `${repoRoot}/${WORKTREE_DIR}`;
}

/**
 * Ensure .gitignore contains .opencode-wt/
 */
export async function ensureGitignore(repoRoot) {
  const gitignorePath = `${repoRoot}/.gitignore`;
  
  try {
    // Check if .gitignore exists
    const file = Bun.file(gitignorePath);
    const exists = await file.exists();
    
    if (!exists) {
      // Create .gitignore with entry
      await Bun.write(gitignorePath, `${WORKTREE_DIR}/\n`);
      console.log(`${colors.green}✓ Created .gitignore with ${WORKTREE_DIR}/${colors.reset}`);
      return;
    }
    
    // Check if entry already exists
    const content = await file.text();
    const lines = content.split('\n');
    
    // Check for exact match or with trailing slash
    if (lines.includes(WORKTREE_DIR) || lines.includes(`${WORKTREE_DIR}/`)) {
      return; // Already exists
    }
    
    // Add entry
    await Bun.write(gitignorePath, `${content}\n${WORKTREE_DIR}/\n`);
    console.log(`${colors.green}✓ Added ${WORKTREE_DIR}/ to .gitignore${colors.reset}`);
  } catch (error) {
    console.error(`${colors.yellow}⚠ Warning: Could not update .gitignore: ${error.message}${colors.reset}`);
  }
}

/**
 * Validate branch name format
 */
export async function validateBranchName(branchName) {
  try {
    await $`git check-ref-format --branch ${branchName}`.quiet();
    return true;
  } catch {
    console.error(`${colors.red}❌ Error: Invalid branch name '${branchName}'${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Check if a branch exists locally
 */
export async function branchExists(branchName) {
  try {
    await $`git rev-parse --verify ${branchName}`.quiet();
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a remote branch exists
 */
export async function remoteBranchExists(branchName) {
  try {
    await $`git rev-parse --verify origin/${branchName}`.quiet();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current branch name
 */
export async function getCurrentBranch() {
  try {
    const branch = await $`git rev-parse --abbrev-ref HEAD`.text();
    return branch.trim();
  } catch {
    return null;
  }
}

/**
 * Parse worktree list into structured data
 */
export async function getWorktrees() {
  try {
    const output = await $`git worktree list --porcelain`.text();
    const worktrees = [];
    let current = {};
    
    for (const line of output.split('\n')) {
      if (line.startsWith('worktree ')) {
        if (current.path) {
          worktrees.push(current);
        }
        current = { path: line.substring(9) };
      } else if (line.startsWith('HEAD ')) {
        current.commit = line.substring(5);
      } else if (line.startsWith('branch ')) {
        current.branch = line.substring(7).replace('refs/heads/', '');
      } else if (line === 'bare') {
        current.bare = true;
      } else if (line === 'detached') {
        current.detached = true;
      } else if (line.startsWith('locked ')) {
        current.locked = line.substring(7);
      } else if (line.startsWith('prunable ')) {
        current.prunable = line.substring(9);
      }
    }
    
    if (current.path) {
      worktrees.push(current);
    }
    
    return worktrees;
  } catch (error) {
    console.error(`${colors.red}❌ Error: Could not list worktrees: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Get worktree path for a branch
 */
export async function getWorktreeForBranch(branchName, repoRoot) {
  const worktrees = await getWorktrees();
  return worktrees.find(wt => wt.branch === branchName);
}

/**
 * Open a new OpenCode session in the specified directory
 */
export async function openOpenCodeSession(path) {
  try {
    console.log(`${colors.blue}ℹ Opening new OpenCode session in ${path}...${colors.reset}`);
    // Spawn opencode in a new process, detached from current one
    const proc = Bun.spawn(['opencode', path], {
      detached: true,
      stdio: 'ignore',
    });
    proc.unref();
    console.log(`${colors.green}✓ OpenCode session launched${colors.reset}`);
  } catch (error) {
    console.error(`${colors.yellow}⚠ Warning: Could not open OpenCode session: ${error.message}${colors.reset}`);
    console.log(`${colors.cyan}You can manually open it with: opencode ${path}${colors.reset}`);
  }
}

/**
 * Format a relative path from repo root
 */
export function formatPath(fullPath, repoRoot) {
  if (fullPath.startsWith(repoRoot + '/')) {
    return fullPath.substring(repoRoot.length + 1);
  }
  return fullPath;
}

/**
 * Print a horizontal line separator
 */
export function printSeparator(char = '━', width = 42) {
  console.log(colors.blue + char.repeat(width) + colors.reset);
}

/**
 * Print a section header
 */
export function printHeader(title) {
  printSeparator();
  console.log(`${colors.blue}   ${title}${colors.reset}`);
  printSeparator();
  console.log('');
}
