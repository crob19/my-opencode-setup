#!/usr/bin/env bun

/**
 * GitHub Copilot Usage Script
 * 
 * Standalone script to check Copilot billing and usage
 */

import { $ } from "bun";

/**
 * Check if an error is an authentication or permission error
 * @param {Error} error - The error to check
 * @returns {boolean} - True if this is an auth/permission error that should be rethrown
 */
function isAuthError(error) {
  return error.stderr && (error.stderr.includes("user") || error.stderr.includes("admin:org"));
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let account = null;
  let month = null;
  let year = null;
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--month' && i + 1 < args.length) {
      month = parseInt(args[i + 1]);
      if (isNaN(month)) {
        console.error('Error: --month must be a number');
        process.exit(1);
      }
      i++;
    } else if (args[i] === '--year' && i + 1 < args.length) {
      year = parseInt(args[i + 1]);
      if (isNaN(year)) {
        console.error('Error: --year must be a number');
        process.exit(1);
      }
      i++;
    } else if (args[i] === '--verbose') {
      verbose = true;
    } else if (!account) {
      account = args[i];
    }
  }

  // Get current date for defaults
  const now = new Date();
  year = year || now.getFullYear();
  month = month || now.getMonth() + 1;

  // Determine account type
  let accountType = "personal";
  let accountName = "";

  if (account && account !== "personal") {
    accountType = "org";
    accountName = account;
  } else if (!account) {
    // Auto-detect from git remote
    try {
      const remote = await $`git remote get-url origin 2>/dev/null`.text();
      const match = remote.match(/[:/]([^/]+)\/[^/]+(?:\.git)?/);
      if (match) {
        const owner = match[1];
        // Check if it's an org
        const orgs = await $`gh api /user/orgs --jq '.[].login'`.text();
        if (orgs.split('\n').map(o => o.trim()).includes(owner)) {
          accountType = "org";
          accountName = owner;
        }
      }
    } catch {
      // Fall through to personal
    }
  }

  if (accountType === "personal" && !accountName) {
    // Get username
    accountName = await $`gh api /user --jq '.login'`.text();
    accountName = accountName.trim();
  }

  // Build query params
  const params = [`year=${year}`];
  if (month) params.push(`month=${month}`);
  const queryString = params.length > 0 ? `?${params.join("&")}` : "";

  // Fetch data
  let usageSummary = {};
  let premiumUsage = {};
  let seatInfo = {};

  try {
    if (accountType === "personal") {
      try {
        usageSummary = await $`gh api /users/${accountName}/settings/billing/usage/summary${queryString}`.json();
      } catch (e) {
        // Check for authentication/permission errors and rethrow
        if (isAuthError(e)) {
          throw e;
        }
        // Otherwise, may not exist - suppress error
      }

      try {
        premiumUsage = await $`gh api /users/${accountName}/settings/billing/premium_request/usage${queryString}`.json();
      } catch (e) {
        // Check for authentication/permission errors and rethrow
        if (isAuthError(e)) {
          throw e;
        }
        // Premium usage might not exist - suppress error
      }
    } else {
      try {
        usageSummary = await $`gh api /organizations/${accountName}/settings/billing/usage/summary${queryString}`.json();
      } catch (e) {
        // Check for authentication/permission errors and rethrow
        if (isAuthError(e)) {
          throw e;
        }
        // Otherwise, may not exist - suppress error
      }

      try {
        premiumUsage = await $`gh api /organizations/${accountName}/settings/billing/premium_request/usage${queryString}`.json();
      } catch (e) {
        // Check for authentication/permission errors and rethrow
        if (isAuthError(e)) {
          throw e;
        }
        // Premium usage might not exist - suppress error
      }

      try {
        seatInfo = await $`gh api /orgs/${accountName}/copilot/billing`.json();
      } catch (e) {
        // Check for authentication/permission errors and rethrow
        if (isAuthError(e)) {
          throw e;
        }
        // Seat info might not be available - suppress error
      }
    }
  } catch (error) {
    if (error.stderr && error.stderr.includes("user")) {
      console.log(`❌ Error: Missing GitHub CLI scope.\n\nRun: gh auth refresh -h github.com -s user`);
      process.exit(1);
    } else if (error.stderr && error.stderr.includes("admin:org")) {
      console.log(`❌ Error: Missing GitHub CLI scope.\n\nRun: gh auth refresh -h github.com -s admin:org`);
      process.exit(1);
    } else if (error.exitCode === 404) {
      console.log(`❌ Error: No billing data found.\n\nThis could mean:\n- Enhanced billing platform is not enabled\n- Copilot is not active on this account\n- No usage data for the specified period`);
      process.exit(1);
    }
    throw error;
  }

  // Format output
  let output = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  output += "   GitHub Copilot Usage Report\n";
  output += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  if (accountType === "personal") {
    output += `Account: Personal (${accountName})\n`;
  } else {
    output += `Account: Organization (${accountName})\n`;
  }

  const period = usageSummary.timePeriod || premiumUsage.timePeriod;
  if (period) {
    if (period.month) {
      output += `Period: ${period.month}/${period.year}\n`;
    } else {
      output += `Period: ${period.year}\n`;
    }
  }

  output += "\n";

  // Seat information for orgs
  if (accountType === "org" && seatInfo.seat_breakdown) {
    output += "━━━ Seat Information ━━━\n";
    output += `Total seats: ${seatInfo.seat_breakdown.total || 0}\n`;
    output += `Active this cycle: ${seatInfo.seat_breakdown.active_this_cycle || 0}\n`;
    output += `Inactive this cycle: ${seatInfo.seat_breakdown.inactive_this_cycle || 0}\n`;
    if ((seatInfo.seat_breakdown.pending_cancellation || 0) > 0) {
      output += `Pending cancellation: ${seatInfo.seat_breakdown.pending_cancellation}\n`;
    }
    if (seatInfo.plan_type) {
      output += `Plan type: ${seatInfo.plan_type}\n`;
    }
    output += "\n";
  }

  // Usage items
  let totalCost = 0;
  const allItems = [
    ...(usageSummary.usageItems || []),
    ...(premiumUsage.usageItems || []),
  ];

  if (allItems.length === 0) {
    output += "No Copilot usage for this period.\n";
  } else {
    const copilotItems = allItems.filter(
      (item) =>
        (item.product && item.product.toLowerCase().includes("copilot")) ||
        (item.sku && item.sku.toLowerCase().includes("copilot"))
    );

    if (copilotItems.length === 0) {
      output += "No Copilot usage for this period.\n";
    } else {
      output += "━━━ Copilot Usage ━━━\n";

      const premiumItems = copilotItems.filter(
        (item) =>
          item.model ||
          (item.sku && item.sku.toLowerCase().includes("premium")) ||
          (item.sku && item.sku.toLowerCase().includes("request"))
      );
      const standardItems = copilotItems.filter((item) => !premiumItems.includes(item));

      if (standardItems.length > 0) {
        for (const item of standardItems) {
          output += `\n${item.product || "Copilot"}\n`;
          if (item.sku) output += `  SKU: ${item.sku}\n`;
          if (item.grossQuantity && item.unitType) {
            output += `  Quantity: ${item.grossQuantity} ${item.unitType}\n`;
          }
          if (verbose && item.pricePerUnit) {
            output += `  Price per unit: $${item.pricePerUnit.toFixed(4)}\n`;
          }
          if (verbose && item.grossAmount) {
            output += `  Gross amount: $${item.grossAmount.toFixed(2)}\n`;
          }
          if (item.discountAmount && item.discountAmount > 0) {
            output += `  Discount: -$${item.discountAmount.toFixed(2)}\n`;
          }
          if (item.netAmount !== undefined) {
            output += `  Net cost: $${item.netAmount.toFixed(2)}\n`;
            totalCost += item.netAmount;
          }
        }
      }

      if (premiumItems.length > 0) {
        output += "\n━━━ Premium Request Usage ━━━\n";
        for (const item of premiumItems) {
          output += `\n${item.model || item.product || "Premium Requests"}\n`;
          if (item.model) output += `  Model: ${item.model}\n`;
          if (item.grossQuantity) {
            output += `  Requests: ${item.grossQuantity}\n`;
          }
          if (verbose && item.pricePerUnit) {
            output += `  Price per request: $${item.pricePerUnit.toFixed(4)}\n`;
          }
          if (item.discountAmount && item.discountAmount > 0) {
            output += `  Discount: -$${item.discountAmount.toFixed(2)}\n`;
          }
          if (item.netAmount !== undefined) {
            output += `  Net cost: $${item.netAmount.toFixed(2)}\n`;
            totalCost += item.netAmount;
          }
        }
      }

      output += "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
      output += `Total Net Cost: $${totalCost.toFixed(2)}\n`;
      output += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    }
  }

  console.log(output);
}

main().catch((error) => {
  console.error(`❌ Error: ${error.message || error}`);
  if (error.stderr) console.error(error.stderr);
  process.exit(1);
});
