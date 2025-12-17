#!/usr/bin/env node

/**
 * Git Worktree Status Script
 * 
 * Shows status of all worktrees including uncommitted changes and remote status
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
${colors.blue}Usage:${colors.reset} /worktree-status [options]

${colors.blue}Shows detailed status of all worktrees${colors.reset}

${colors.blue}Options:${colors.reset}
  --help, -h          Show this help message

${colors.blue}Example:${colors.reset}
  ${colors.cyan}/worktree-status${colors.reset}
`);
  process.exit(0);
}

/**
 * Get git status for a worktree
 */
async function getWorktreeStatus(worktreePath) {
  try {
    const statusOutput = await $`git -C ${worktreePath} status --porcelain`.text();
    const lines = statusOutput.trim().split('\n').filter(l => l);
    
    const status = {
      clean: lines.length === 0,
      modified: 0,
      added: 0,
      deleted: 0,
      untracked: 0,
      total: lines.length,
    };
    
    for (const line of lines) {
      const code = line.substring(0, 2);
      if (code.includes('M')) status.modified++;
      if (code.includes('A')) status.added++;
      if (code.includes('D')) status.deleted++;
      if (code.includes('?')) status.untracked++;
    }
    
    return status;
  } catch {
    return { error: true };
  }
}

/**
 * Get remote tracking info for a branch
 */
async function getRemoteStatus(worktreePath, branch) {
  if (!branch) return null;
  
  try {
    // Check if branch has upstream
    const upstream = await $`git -C ${worktreePath} rev-parse --abbrev-ref ${branch}@{upstream}`.text();
    if (!upstream.trim()) return null;
    
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
 * Get last commit info
 */
async function getLastCommit(worktreePath) {
  try {
    const message = await $`git -C ${worktreePath} log -1 --pretty=format:%s`.text();
    const time = await $`git -C ${worktreePath} log -1 --pretty=format:%cr`.text();
    return {
      message: message.trim(),
      time: time.trim(),
    };
  } catch {
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    usage();
  }
  
  await checkGitRepo();
  const repoRoot = await getRepoRoot();
  const worktrees = await getWorktrees();
  
  printHeader('Git Worktree Status');
  
  if (worktrees.length === 0) {
    console.log(`${colors.gray}No worktrees found${colors.reset}\n`);
    return;
  }
  
  // Process each worktree
  for (let i = 0; i < worktrees.length; i++) {
    const wt = worktrees[i];
    const isMain = wt.path === repoRoot;
    const displayPath = formatPath(wt.path, repoRoot);
    
    // Header for this worktree
    if (isMain) {
      console.log(`${colors.cyan}${displayPath}${colors.reset} ${colors.blue}(main worktree)${colors.reset}`);
    } else {
      console.log(`${colors.cyan}.${displayPath}${colors.reset}`);
    }
    
    // Branch info
    if (wt.branch) {
      console.log(`  ${colors.blue}Branch:${colors.reset} ${wt.branch}`);
    } else if (wt.detached) {
      console.log(`  ${colors.blue}Branch:${colors.reset} ${colors.gray}(detached HEAD)${colors.reset}`);
    }
    
    // Status
    const status = await getWorktreeStatus(wt.path);
    if (status.error) {
      console.log(`  ${colors.blue}Status:${colors.reset} ${colors.red}Error reading status${colors.reset}`);
    } else if (status.clean) {
      console.log(`  ${colors.blue}Status:${colors.reset} ${colors.green}Clean working directory${colors.reset}`);
    } else {
      const parts = [];
      if (status.modified > 0) parts.push(`${status.modified} modified`);
      if (status.added > 0) parts.push(`${status.added} added`);
      if (status.deleted > 0) parts.push(`${status.deleted} deleted`);
      if (status.untracked > 0) parts.push(`${status.untracked} untracked`);
      console.log(`  ${colors.blue}Status:${colors.reset} ${colors.yellow}${parts.join(', ')}${colors.reset}`);
    }
    
    // Remote status
    if (wt.branch) {
      const remote = await getRemoteStatus(wt.path, wt.branch);
      if (remote) {
        if (remote.noUpstream) {
          console.log(`  ${colors.blue}Remote:${colors.reset} ${colors.gray}No upstream branch${colors.reset}`);
        } else if (remote.upToDate) {
          console.log(`  ${colors.blue}Remote:${colors.reset} ${colors.green}Up to date with ${remote.upstream}${colors.reset}`);
        } else {
          const parts = [];
          if (remote.ahead > 0) parts.push(`${colors.yellow}${remote.ahead} ahead${colors.reset}`);
          if (remote.behind > 0) parts.push(`${colors.red}${remote.behind} behind${colors.reset}`);
          console.log(`  ${colors.blue}Remote:${colors.reset} ${parts.join(', ')}`);
        }
      }
    }
    
    // Last commit
    const commit = await getLastCommit(wt.path);
    if (commit) {
      console.log(`  ${colors.blue}Last commit:${colors.reset} ${colors.gray}"${commit.message}" (${commit.time})${colors.reset}`);
    }
    
    // Separator between worktrees (except last one)
    if (i < worktrees.length - 1) {
      console.log('');
    }
  }
  
  console.log('');
  printSeparator();
  
  // Summary
  const cleanCount = (await Promise.all(
    worktrees.map(wt => getWorktreeStatus(wt.path))
  )).filter(s => s.clean).length;
  
  const dirtyCount = worktrees.length - cleanCount;
  
  console.log(`${colors.gray}Total: ${worktrees.length} worktree${worktrees.length !== 1 ? 's' : ''}`);
  console.log(`Clean: ${cleanCount}, With changes: ${dirtyCount}${colors.reset}\n`);
}

main().catch((error) => {
  console.error(`${colors.red}❌ Error: ${error.message || error}${colors.reset}`);
  if (error.stderr) console.error(error.stderr);
  process.exit(1);
});
