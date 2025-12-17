#!/usr/bin/env node

/**
 * Git Worktree Remove Script
 * 
 * Removes a git worktree and optionally deletes the branch
 */

import { $ } from "bun";
import {
  WORKTREE_DIR,
  colors,
  checkGitRepo,
  getRepoRoot,
  getWorktrees,
  getWorktreeForBranch,
  formatPath,
  printHeader,
} from "./worktree-common.mjs";

/**
 * Print usage information
 */
function usage() {
  console.log(`
${colors.blue}Usage:${colors.reset} /worktree-remove <branch-name> [options]

${colors.blue}Removes a git worktree${colors.reset}

${colors.blue}Arguments:${colors.reset}
  <branch-name>       Name of the branch/worktree to remove

${colors.blue}Options:${colors.reset}
  --delete-branch     Also delete the branch after removing worktree
  --force            Force removal even with uncommitted changes
  --help, -h         Show this help message

${colors.blue}Examples:${colors.reset}
  ${colors.cyan}/worktree-remove feature-auth${colors.reset}
  ${colors.cyan}/worktree-remove feature-api --delete-branch${colors.reset}
  ${colors.cyan}/worktree-remove old-feature --force --delete-branch${colors.reset}
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
  let deleteBranch = false;
  let force = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--delete-branch') {
      deleteBranch = true;
    } else if (args[i] === '--force') {
      force = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      usage();
    } else if (args[i].startsWith('-')) {
      console.error(`${colors.red}❌ Error: Unknown option '${args[i]}'${colors.reset}`);
      console.log(`\nRun ${colors.cyan}/worktree-remove --help${colors.reset} for usage information`);
      process.exit(1);
    } else if (!branchName) {
      branchName = args[i];
    } else {
      console.error(`${colors.red}❌ Error: Multiple branch names provided${colors.reset}`);
      console.log(`\nRun ${colors.cyan}/worktree-remove --help${colors.reset} for usage information`);
      process.exit(1);
    }
  }
  
  await checkGitRepo();
  const repoRoot = await getRepoRoot();
  
  printHeader('Git Worktree Remove');
  
  // If no branch name provided, list available worktrees
  if (!branchName) {
    console.log(`${colors.yellow}No branch name provided. Available worktrees:${colors.reset}\n`);
    const worktrees = await getWorktrees();
    const linked = worktrees.filter(wt => wt.path !== repoRoot && wt.branch);
    
    if (linked.length === 0) {
      console.log(`${colors.gray}No linked worktrees found${colors.reset}\n`);
      console.log(`Run ${colors.cyan}/worktree-remove <branch-name>${colors.reset} to remove a worktree\n`);
      return;
    }
    
    for (const wt of linked) {
      const displayPath = formatPath(wt.path, repoRoot);
      console.log(`  ${colors.cyan}${wt.branch}${colors.reset} → ${colors.gray}${displayPath}${colors.reset}`);
    }
    
    console.log(`\nRun ${colors.cyan}/worktree-remove <branch-name>${colors.reset} to remove a worktree\n`);
    return;
  }
  
  // Find the worktree
  const worktree = await getWorktreeForBranch(branchName, repoRoot);
  
  if (!worktree) {
    console.error(`${colors.red}❌ Error: No worktree found for branch '${branchName}'${colors.reset}\n`);
    console.log(`Run ${colors.cyan}/worktree-list${colors.reset} to see available worktrees\n`);
    process.exit(1);
  }
  
  // Prevent removing main worktree
  if (worktree.path === repoRoot) {
    console.error(`${colors.red}❌ Error: Cannot remove the main worktree${colors.reset}\n`);
    console.log(`The main worktree is at ${colors.cyan}${repoRoot}${colors.reset}`);
    console.log(`You can only remove linked worktrees in ${colors.cyan}${WORKTREE_DIR}/${colors.reset}\n`);
    process.exit(1);
  }
  
  const displayPath = formatPath(worktree.path, repoRoot);
  console.log(`${colors.blue}Worktree:${colors.reset} ${colors.cyan}${displayPath}${colors.reset}`);
  console.log(`${colors.blue}Branch:${colors.reset}   ${colors.cyan}${branchName}${colors.reset}\n`);
  
  // Check for uncommitted changes (unless force)
  if (!force) {
    try {
      const status = await $`git -C ${worktree.path} status --porcelain`.text();
      if (status.trim()) {
        console.error(`${colors.red}❌ Error: Worktree has uncommitted changes${colors.reset}\n`);
        console.log(`Uncommitted changes:`);
        console.log(status);
        console.log(`Use ${colors.cyan}--force${colors.reset} to remove anyway\n`);
        process.exit(1);
      }
    } catch (error) {
      console.log(`${colors.yellow}⚠ Warning: Could not check worktree status${colors.reset}`);
    }
  }
  
  try {
    // Remove the worktree
    console.log(`${colors.blue}ℹ Removing worktree...${colors.reset}`);
    if (force) {
      await $`git worktree remove ${worktree.path} --force`;
    } else {
      await $`git worktree remove ${worktree.path}`;
    }
    
    console.log(`${colors.green}✓ Worktree removed${colors.reset}\n`);
    
    // Delete branch if requested
    if (deleteBranch) {
      console.log(`${colors.blue}ℹ Deleting branch '${branchName}'...${colors.reset}`);
      try {
        if (force) {
          await $`git branch -D ${branchName}`;
        } else {
          await $`git branch -d ${branchName}`;
        }
        console.log(`${colors.green}✓ Branch deleted${colors.reset}\n`);
      } catch (error) {
        console.error(`${colors.yellow}⚠ Warning: Could not delete branch${colors.reset}`);
        if (error.stderr) {
          console.error(error.stderr.toString().trim());
        }
        console.log(`\nThe worktree was removed but the branch still exists.`);
        console.log(`Use ${colors.cyan}git branch -D ${branchName}${colors.reset} to force delete it\n`);
      }
    }
    
    console.log(`${colors.green}✅ Done!${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}❌ Error: Failed to remove worktree${colors.reset}`);
    if (error.stderr) {
      console.error(`\n${error.stderr.toString()}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`${colors.red}❌ Error: ${error.message || error}${colors.reset}`);
  if (error.stderr) console.error(error.stderr);
  process.exit(1);
});
