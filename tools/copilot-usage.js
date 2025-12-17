/**
 * GitHub Copilot Usage Tool
 * 
 * Fetches and displays GitHub Copilot billing and usage information
 * without requiring AI agent interpretation.
 */

import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Check GitHub Copilot usage and billing information",
  args: {
    account: tool.schema.string().optional().describe("Account to check: 'personal' or organization name. Auto-detects from git remote if not provided."),
    month: tool.schema.number().optional().describe("Month to query (1-12)"),
    year: tool.schema.number().optional().describe("Year to query (e.g., 2024)"),
    verbose: tool.schema.boolean().optional().describe("Show detailed SKU and pricing breakdown"),
  },
  
  async execute(args) {
    try {
      // Get current date for defaults
      const now = new Date();
      const year = args.year || now.getFullYear();
      const month = args.month || now.getMonth() + 1;

      // Determine account type
      let accountType = "personal";
      let accountName = "";

      if (args.account && args.account !== "personal") {
        accountType = "org";
        accountName = args.account;
      } else if (!args.account) {
        // Auto-detect from git remote
        try {
          const remote = await Bun.$`git remote get-url origin 2>/dev/null`.text();
          const match = remote.match(/[:/]([^/]+)\/[^/]+(?:\.git)?/);
          if (match) {
            const owner = match[1];
            // Check if it's an org
            const orgs = await Bun.$`gh api /user/orgs --jq '.[].login'`.text();
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
        accountName = await Bun.$`gh api /user --jq '.login'`.text();
        accountName = accountName.trim();
      }

      // Build query params
      const params = [`year=${year}`];
      if (args.month) params.push(`month=${month}`);
      const queryString = params.length > 0 ? `?${params.join("&")}` : "";

      // Fetch data
      let usageSummary = {};
      let premiumUsage = {};
      let seatInfo = {};

      try {
        if (accountType === "personal") {
          // Personal account endpoints
          try {
            usageSummary = await Bun.$`gh api /users/${accountName}/settings/billing/usage/summary${queryString}`.json();
          } catch (e) {
            // May not exist
          }

          try {
            premiumUsage = await Bun.$`gh api /users/${accountName}/settings/billing/premium_request/usage${queryString}`.json();
          } catch {
            // Premium usage might not exist
          }
        } else {
          // Organization endpoints
          try {
            usageSummary = await Bun.$`gh api /organizations/${accountName}/settings/billing/usage/summary${queryString}`.json();
          } catch (e) {
            // May not exist
          }

          try {
            premiumUsage = await Bun.$`gh api /organizations/${accountName}/settings/billing/premium_request/usage${queryString}`.json();
          } catch {
            // Premium usage might not exist
          }

          // Get seat information
          try {
            seatInfo = await Bun.$`gh api /orgs/${accountName}/copilot/billing`.json();
          } catch {
            // Seat info might not be available
          }
        }
      } catch (error) {
        if (error.stderr && error.stderr.includes("user")) {
          return `❌ Error: Missing GitHub CLI scope.\n\nRun: gh auth refresh -h github.com -s user`;
        } else if (error.stderr && error.stderr.includes("admin:org")) {
          return `❌ Error: Missing GitHub CLI scope.\n\nRun: gh auth refresh -h github.com -s admin:org`;
        } else if (error.exitCode === 404) {
          return `❌ Error: No billing data found.\n\nThis could mean:\n- Enhanced billing platform is not enabled\n- Copilot is not active on this account\n- No usage data for the specified period`;
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
        // Filter for Copilot-related items
        const copilotItems = allItems.filter(
          (item) =>
            (item.product && item.product.toLowerCase().includes("copilot")) ||
            (item.sku && item.sku.toLowerCase().includes("copilot"))
        );

        if (copilotItems.length === 0) {
          output += "No Copilot usage for this period.\n";
        } else {
          output += "━━━ Copilot Usage ━━━\n";

          // Group by premium vs standard
          const premiumItems = copilotItems.filter(
            (item) =>
              item.model ||
              (item.sku && item.sku.toLowerCase().includes("premium")) ||
              (item.sku && item.sku.toLowerCase().includes("request"))
          );
          const standardItems = copilotItems.filter((item) => !premiumItems.includes(item));

          // Standard usage
          if (standardItems.length > 0) {
            for (const item of standardItems) {
              output += `\n${item.product || "Copilot"}\n`;
              if (item.sku) output += `  SKU: ${item.sku}\n`;
              if (item.grossQuantity && item.unitType) {
                output += `  Quantity: ${item.grossQuantity} ${item.unitType}\n`;
              }
              if (args.verbose && item.pricePerUnit) {
                output += `  Price per unit: $${item.pricePerUnit.toFixed(4)}\n`;
              }
              if (args.verbose && item.grossAmount) {
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

          // Premium usage
          if (premiumItems.length > 0) {
            output += "\n━━━ Premium Request Usage ━━━\n";
            for (const item of premiumItems) {
              output += `\n${item.model || item.product || "Premium Requests"}\n`;
              if (item.model) output += `  Model: ${item.model}\n`;
              if (item.grossQuantity) {
                output += `  Requests: ${item.grossQuantity}\n`;
              }
              if (args.verbose && item.pricePerUnit) {
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

      return output;
    } catch (error) {
      return `❌ Error: ${error.message || error}\n\n${error.stderr || ""}`;
    }
  },
});
