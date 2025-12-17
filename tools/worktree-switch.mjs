#!/usr/bin/env node

/**
 * Git Worktree Switch Script
 * 
 * Opens an OpenCode session in a worktree
 */

import { $ } from "bun";
import {
  colors,
  checkGitRepo,
  getRepoRoot,
  getWorktrees,
  getWorktreeForBranch,
  formatPath,
  openOpenCodeSession,
  printHeader,
} from "./worktree-common.mjs";

/**
 * Print usage information
 */
function usage() {
  console.log(`
${colors.blue}Usage:${colors.reset} /worktree-switch [branch-name]

${colors.blue}Opens an OpenCode session in the specified worktree${colors.reset}

${colors.blue}Arguments:${colors.reset}
  [branch-name]       Name of the branch/worktree to switch to (optional)

${colors.blue}Options:${colors.reset}
  --help, -h          Show this help message

${colors.blue}Examples:${colors.reset}
  ${colors.cyan}/worktree-switch${colors.reset}               # Shows available worktrees
  ${colors.cyan}/worktree-switch feature-auth${colors.reset}  # Opens feature-auth worktree
`);
  process.exit(0);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let branchName = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--help' || args[i] === '-h') {
      usage();
    } else if (args[i].startsWith('-')) {
      console.error(`${colors.red}❌ Error: Unknown option '${args[i]}'${colors.reset}`);
      console.log(`\nRun ${colors.cyan}/worktree-switch --help${colors.reset} for usage information`);
      process.exit(1);
    } else if (!branchName) {
      branchName = args[i];
    } else {
      console.error(`${colors.red}❌ Error: Multiple branch names provided${colors.reset}`);
      console.log(`\nRun ${colors.cyan}/worktree-switch --help${colors.reset} for usage information`);
      process.exit(1);
    }
  }
  
  await checkGitRepo();
  const repoRoot = await getRepoRoot();
  
  printHeader('Git Worktree Switch');
  
  // If no branch name provided, list available worktrees
  if (!branchName) {
    console.log(`${colors.yellow}No branch name provided. Available worktrees:${colors.reset}\n`);
    const worktrees = await getWorktrees();
    
    // Get current directory to highlight current worktree
    let currentPath = null;
    try {
      currentPath = await $`pwd`.text();
      currentPath = currentPath.trim();
    } catch {
      // Ignore
    }
    
    if (worktrees.length === 0) {
      console.log(`${colors.gray}No worktrees found${colors.reset}\n`);
      return;
    }
    
    for (const wt of worktrees) {
      const displayPath = formatPath(wt.path, repoRoot);
      const isCurrent = wt.path === currentPath;
      const isMain = wt.path === repoRoot;
      
      let line = '';
      
      if (wt.branch) {
        line = `  ${colors.cyan}${wt.branch}${colors.reset}`;
      } else {
        line = `  ${colors.gray}(detached HEAD)${colors.reset}`;
      }
      
      line += ` → ${colors.gray}${displayPath}${colors.reset}`;
      
      if (isCurrent) {
        line += ` ${colors.green}(current)${colors.reset}`;
      } else if (isMain) {
        line += ` ${colors.blue}(main)${colors.reset}`;
      }
      
      console.log(line);
    }
    
    console.log(`\nRun ${colors.cyan}/worktree-switch <branch-name>${colors.reset} to switch to a worktree\n`);
    return;
  }
  
  // Find the worktree
  const worktree = await getWorktreeForBranch(branchName, repoRoot);
  
  if (!worktree) {
    console.error(`${colors.red}❌ Error: No worktree found for branch '${branchName}'${colors.reset}\n`);
    console.log(`Run ${colors.cyan}/worktree-list${colors.reset} to see available worktrees`);
    console.log(`Or run ${colors.cyan}/worktree-add ${branchName}${colors.reset} to create a new worktree\n`);
    process.exit(1);
  }
  
  const displayPath = formatPath(worktree.path, repoRoot);
  console.log(`${colors.blue}Worktree:${colors.reset} ${colors.cyan}${displayPath}${colors.reset}`);
  console.log(`${colors.blue}Branch:${colors.reset}   ${colors.cyan}${branchName}${colors.reset}\n`);
  
  // Open OpenCode session
  await openOpenCodeSession(worktree.path);
}

main().catch((error) => {
  console.error(`${colors.red}❌ Error: ${error.message || error}${colors.reset}`);
  if (error.stderr) console.error(error.stderr);
  process.exit(1);
});
