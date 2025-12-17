#!/usr/bin/env node

/**
 * Git Worktree Sync Script
 * 
 * Fetches from remote and shows which worktrees have updates available
 */

import { $ } from "bun";
import {
  colors,
  checkGitRepo,
  getRepoRoot,
  getWorktrees,
  formatPath,
  printHeader,
  printSeparator,
} from "./worktree-common.mjs";

/**
 * Print usage information
 */
function usage() {
  console.log(`
${colors.blue}Usage:${colors.reset} /worktree-sync [options]

${colors.blue}Fetches from remote and shows which worktrees have updates${colors.reset}

${colors.blue}Options:${colors.reset}
  --pull              Automatically pull updates in each worktree
  --help, -h          Show this help message

${colors.blue}Examples:${colors.reset}
  ${colors.cyan}/worktree-sync${colors.reset}         # Fetch and show status
  ${colors.cyan}/worktree-sync --pull${colors.reset}  # Fetch and pull in all worktrees
`);
  process.exit(0);
}

/**
 * Get remote tracking info for a branch
 */
async function getRemoteStatus(worktreePath, branch) {
  if (!branch) return null;
  
  try {
    // Check if branch has upstream
    const upstream = await $`git -C ${worktreePath} rev-parse --abbrev-ref ${branch}@{upstream}`.text();
    if (!upstream.trim()) return { noUpstream: true };
    
    // Get ahead/behind counts
    const counts = await $`git -C ${worktreePath} rev-list --left-right --count ${branch}...${branch}@{upstream}`.text();
    const [ahead, behind] = counts.trim().split('\t').map(Number);
    
    return {
      upstream: upstream.trim(),
      ahead: ahead || 0,
      behind: behind || 0,
      upToDate: ahead === 0 && behind === 0,
    };
  } catch {
    return { noUpstream: true };
  }
}

/**
 * Check if worktree has uncommitted changes
 */
async function hasUncommittedChanges(worktreePath) {
  try {
    const status = await $`git -C ${worktreePath} status --porcelain`.text();
    return status.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Pull updates in a worktree
 */
async function pullWorktree(worktreePath, branch) {
  try {
    await $`git -C ${worktreePath} pull --ff-only`.quiet();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.stderr?.toString() || error.message };
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let autoPull = false;
  
  for (const arg of args) {
    if (arg === '--pull') {
      autoPull = true;
    } else if (arg === '--help' || arg === '-h') {
      usage();
    } else {
      console.error(`${colors.red}❌ Error: Unknown option '${arg}'${colors.reset}`);
      console.log(`\nRun ${colors.cyan}/worktree-sync --help${colors.reset} for usage information`);
      process.exit(1);
    }
  }
  
  await checkGitRepo();
  const repoRoot = await getRepoRoot();
  
  printHeader('Git Worktree Sync');
  
  // Fetch from remote
  console.log(`${colors.blue}ℹ Fetching from remote...${colors.reset}`);
  try {
    await $`git fetch origin`;
    console.log(`${colors.green}✓ Fetch complete${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}❌ Error: Failed to fetch from remote${colors.reset}`);
    if (error.stderr) {
      console.error(error.stderr.toString());
    }
    process.exit(1);
  }
  
  printSeparator();
  console.log('');
  
  const worktrees = await getWorktrees();
  
  if (worktrees.length === 0) {
    console.log(`${colors.gray}No worktrees found${colors.reset}\n`);
    return;
  }
  
  let updatedCount = 0;
  let errorCount = 0;
  let upToDateCount = 0;
  
  // Process each worktree
  for (const wt of worktrees) {
    const isMain = wt.path === repoRoot;
    const displayPath = formatPath(wt.path, repoRoot);
    
    // Print worktree header
    if (isMain) {
      console.log(`${colors.cyan}${displayPath}${colors.reset} ${colors.blue}(main)${colors.reset}`);
    } else {
      console.log(`${colors.cyan}.${displayPath}${colors.reset}`);
    }
    
    if (!wt.branch) {
      console.log(`  ${colors.gray}Detached HEAD - skipping${colors.reset}\n`);
      continue;
    }
    
    console.log(`  ${colors.blue}Branch:${colors.reset} ${wt.branch}`);
    
    // Get remote status
    const remote = await getRemoteStatus(wt.path, wt.branch);
    
    if (!remote || remote.noUpstream) {
      console.log(`  ${colors.gray}No remote tracking branch${colors.reset}\n`);
      continue;
    }
    
    // Show remote status
    if (remote.upToDate) {
      console.log(`  ${colors.green}✓ Up to date with ${remote.upstream}${colors.reset}`);
      upToDateCount++;
      
      if (autoPull) {
        console.log('');
      }
      continue;
    }
    
    // Show what's different
    const parts = [];
    if (remote.ahead > 0) {
      parts.push(`${colors.yellow}${remote.ahead} commit${remote.ahead !== 1 ? 's' : ''} ahead${colors.reset}`);
    }
    if (remote.behind > 0) {
      parts.push(`${colors.red}${remote.behind} commit${remote.behind !== 1 ? 's' : ''} behind${colors.reset}`);
    }
    console.log(`  ${parts.join(', ')}`);
    
    // If behind and auto-pull enabled
    if (remote.behind > 0 && autoPull) {
      // Check for uncommitted changes
      const hasChanges = await hasUncommittedChanges(wt.path);
      
      if (hasChanges) {
        console.log(`  ${colors.yellow}⚠ Skipping pull - uncommitted changes present${colors.reset}\n`);
        errorCount++;
        continue;
      }
      
      console.log(`  ${colors.blue}ℹ Pulling updates...${colors.reset}`);
      const result = await pullWorktree(wt.path, wt.branch);
      
      if (result.success) {
        console.log(`  ${colors.green}✓ Pull successful${colors.reset}\n`);
        updatedCount++;
      } else {
        console.log(`  ${colors.red}✗ Pull failed: ${result.error}${colors.reset}\n`);
        errorCount++;
      }
    } else if (remote.behind > 0) {
      console.log(`  ${colors.cyan}Run: git -C ${wt.path} pull${colors.reset}\n`);
    } else {
      console.log('');
    }
  }
  
  printSeparator();
  
  // Summary
  if (autoPull) {
    console.log(`${colors.gray}Summary: ${updatedCount} updated, ${upToDateCount} up to date, ${errorCount} errors${colors.reset}\n`);
    
    if (errorCount > 0) {
      console.log(`${colors.yellow}Some worktrees could not be updated. Check for uncommitted changes.${colors.reset}\n`);
    }
  } else {
    const behindStatuses = await Promise.all(
      worktrees.map(async wt => {
        if (!wt.branch) return false;
        const remote = await getRemoteStatus(wt.path, wt.branch);
        return remote && !remote.noUpstream && remote.behind > 0;
      })
    );
    const behindCount = behindStatuses.filter(Boolean).length;
    
    if (behindCount > 0) {
      console.log(`${colors.yellow}${behindCount} worktree${behindCount !== 1 ? 's have' : ' has'} updates available${colors.reset}`);
      console.log(`${colors.cyan}Run /worktree-sync --pull to update all worktrees${colors.reset}\n`);
    } else {
      console.log(`${colors.green}All worktrees are up to date${colors.reset}\n`);
    }
  }
}

main().catch((error) => {
  console.error(`${colors.red}❌ Error: ${error.message || error}${colors.reset}`);
  if (error.stderr) console.error(error.stderr);
  process.exit(1);
});
