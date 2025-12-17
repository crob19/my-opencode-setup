#!/usr/bin/env node

/**
 * Git Worktree List Script
 * 
 * Lists all git worktrees with their status
 */

import { $ } from "bun";
import {
  colors,
  checkGitRepo,
  getRepoRoot,
  getWorktrees,
  formatPath,
  printHeader,
} from "./worktree-common.mjs";

/**
 * Print usage information
 */
function usage() {
  console.log(`
${colors.blue}Usage:${colors.reset} /worktree-list [options]

${colors.blue}Lists all git worktrees with their status${colors.reset}

${colors.blue}Options:${colors.reset}
  --help, -h          Show this help message

${colors.blue}Example:${colors.reset}
  ${colors.cyan}/worktree-list${colors.reset}
`);
  process.exit(0);
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
  
  printHeader('Git Worktrees');
  
  if (worktrees.length === 0) {
    console.log(`${colors.gray}No worktrees found${colors.reset}\n`);
    return;
  }
  
  // Get current worktree path
  let currentPath = null;
  try {
    currentPath = await $`pwd`.text();
    currentPath = currentPath.trim();
  } catch {
    // Ignore
  }
  
  for (const wt of worktrees) {
    const isMain = wt.path === repoRoot;
    const isCurrent = wt.path === currentPath;
    const displayPath = formatPath(wt.path, repoRoot);
    
    // Determine status indicators
    const indicators = [];
    if (isCurrent) indicators.push(`${colors.green}current${colors.reset}`);
    if (isMain) indicators.push(`${colors.blue}main worktree${colors.reset}`);
    if (wt.locked) indicators.push(`${colors.yellow}locked${colors.reset}`);
    if (wt.prunable) indicators.push(`${colors.red}prunable${colors.reset}`);
    if (wt.detached) indicators.push(`${colors.gray}detached HEAD${colors.reset}`);
    
    const statusText = indicators.length > 0 ? ` (${indicators.join(', ')})` : '';
    
    // Print worktree info
    if (isMain) {
      console.log(`${colors.cyan}${displayPath}${colors.reset}${statusText}`);
    } else {
      console.log(`${colors.cyan}.${displayPath}${colors.reset}${statusText}`);
    }
    
    if (wt.branch) {
      console.log(`  ${colors.blue}Branch:${colors.reset} ${wt.branch}`);
    }
    console.log(`  ${colors.blue}Commit:${colors.reset} ${wt.commit.substring(0, 7)}`);
    
    console.log('');
  }
  
  // Summary
  const linkedCount = worktrees.filter(wt => wt.path !== repoRoot).length;
  console.log(`${colors.gray}Total: ${worktrees.length} worktree${worktrees.length !== 1 ? 's' : ''} (${linkedCount} linked)${colors.reset}\n`);
}

main().catch((error) => {
  console.error(`${colors.red}❌ Error: ${error.message || error}${colors.reset}`);
  if (error.stderr) console.error(error.stderr);
  process.exit(1);
});
