#!/usr/bin/env node

/**
 * Git Worktree Add Script
 * 
 * Creates a new git worktree in .opencode-wt/ directory
 */

import { $ } from "bun";
import {
  WORKTREE_DIR,
  colors,
  getRepoRoot,
  checkGitRepo,
  getWorktreeBase,
  ensureGitignore,
  validateBranchName,
  branchExists,
  remoteBranchExists,
  getCurrentBranch,
  getWorktreeForBranch,
  openOpenCodeSession,
  printHeader,
} from "./worktree-common.mjs";

/**
 * Print usage information
 */
function usage() {
  console.log(`
${colors.blue}Usage:${colors.reset} /worktree-add <branch-name> [options]

${colors.blue}Creates a new git worktree in ${WORKTREE_DIR}/<branch-name>${colors.reset}

${colors.blue}Arguments:${colors.reset}
  <branch-name>       Name of the branch to create/checkout

${colors.blue}Options:${colors.reset}
  --from <branch>     Create from specific branch (default: current HEAD)
  --no-open           Don't automatically open OpenCode session
  --help, -h          Show this help message

${colors.blue}Examples:${colors.reset}
  ${colors.cyan}/worktree-add feature-auth${colors.reset}
  ${colors.cyan}/worktree-add feature-api --from main${colors.reset}
  ${colors.cyan}/worktree-add hotfix-123 --from production${colors.reset}
  ${colors.cyan}/worktree-add experiment --no-open${colors.reset}
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
  let baseBranch = null;
  let shouldOpen = true;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--from' && i + 1 < args.length) {
      baseBranch = args[i + 1];
      i++;
    } else if (args[i] === '--no-open') {
      shouldOpen = false;
    } else if (args[i] === '--help' || args[i] === '-h') {
      usage();
    } else if (args[i].startsWith('-')) {
      console.error(`${colors.red}❌ Error: Unknown option '${args[i]}'${colors.reset}`);
      console.log(`\nRun ${colors.cyan}/worktree-add --help${colors.reset} for usage information`);
      process.exit(1);
    } else if (!branchName) {
      branchName = args[i];
    } else {
      console.error(`${colors.red}❌ Error: Multiple branch names provided${colors.reset}`);
      console.log(`\nRun ${colors.cyan}/worktree-add --help${colors.reset} for usage information`);
      process.exit(1);
    }
  }
  
  // Validate arguments
  if (!branchName) {
    console.error(`${colors.red}❌ Error: Branch name required${colors.reset}`);
    console.log(`\nRun ${colors.cyan}/worktree-add --help${colors.reset} for usage information`);
    process.exit(1);
  }
  
  await checkGitRepo();
  await validateBranchName(branchName);
  
  const repoRoot = await getRepoRoot();
  const worktreeBase = getWorktreeBase(repoRoot);
  const worktreePath = `${worktreeBase}/${branchName}`;
  
  printHeader('Git Worktree Add');
  
  // Check if worktree already exists
  const existingWorktree = await getWorktreeForBranch(branchName, repoRoot);
  if (existingWorktree) {
    console.log(`${colors.yellow}⚠ Worktree already exists for branch '${branchName}'${colors.reset}`);
    console.log(`  Path: ${colors.cyan}${existingWorktree.path}${colors.reset}\n`);
    
    if (shouldOpen) {
      await openOpenCodeSession(existingWorktree.path);
    }
    return;
  }
  
  // Ensure .opencode-wt/ directory exists
  await $`mkdir -p ${worktreeBase}`.quiet();
  
  // Ensure .gitignore is configured
  await ensureGitignore(repoRoot);
  
  // Check if branch exists
  const localExists = await branchExists(branchName);
  const remoteExists = await remoteBranchExists(branchName);
  
  try {
    if (localExists) {
      // Branch exists locally - check it out
      console.log(`${colors.blue}ℹ Branch '${branchName}' exists locally, checking out...${colors.reset}`);
      await $`git worktree add ${worktreePath} ${branchName}`;
    } else if (remoteExists) {
      // Branch exists on remote - track it
      console.log(`${colors.blue}ℹ Branch '${branchName}' exists on remote, creating tracking branch...${colors.reset}`);
      await $`git worktree add ${worktreePath} -b ${branchName} origin/${branchName}`;
    } else {
      // Branch doesn't exist - create it
      if (baseBranch) {
        console.log(`${colors.blue}ℹ Creating branch '${branchName}' from '${baseBranch}'...${colors.reset}`);
        await $`git worktree add ${worktreePath} -b ${branchName} ${baseBranch}`;
      } else {
        const currentBranch = await getCurrentBranch();
        console.log(`${colors.blue}ℹ Creating branch '${branchName}' from current HEAD (${currentBranch})...${colors.reset}`);
        await $`git worktree add ${worktreePath} -b ${branchName}`;
      }
    }
    
    // Success!
    console.log('');
    console.log(`${colors.green}✅ Worktree created successfully!${colors.reset}\n`);
    console.log(`  ${colors.blue}Path:${colors.reset}   ${colors.cyan}${worktreePath}${colors.reset}`);
    console.log(`  ${colors.blue}Branch:${colors.reset} ${colors.cyan}${branchName}${colors.reset}\n`);
    
    if (shouldOpen) {
      await openOpenCodeSession(worktreePath);
    } else {
      console.log(`${colors.gray}To open this worktree:${colors.reset}`);
      console.log(`  ${colors.cyan}cd ${worktreePath}${colors.reset}`);
      console.log(`  ${colors.cyan}opencode ${worktreePath}${colors.reset}\n`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error: Failed to create worktree${colors.reset}`);
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
