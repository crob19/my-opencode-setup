/**
 * OpenCode Notifications Plugin
 * 
 * Sends macOS notifications for:
 * - Permission requests (when agent needs approval for edits/commands)
 * - Session completion (when agent finishes working)
 * 
 * Requires: macOS (uses osascript)
 */

export const NotificationPlugin = async ({ project, client, $, directory, worktree }) => {
  console.log("🔔 Notification plugin initialized")

  return {
    event: async ({ event }) => {
      try {
        // Note: -appIcon parameter is broken in terminal-notifier (issue #320)
        // Using terminal-notifier without custom icon for now
        
        // Permission requested - agent needs approval
        if (event.type === "permission.updated") {
          await $`terminal-notifier -title "OpenCode Permission" -message "Agent requesting permission to make changes" -sound Glass -timeout 5`
        }

        // Session idle - agent finished working
        if (event.type === "session.idle") {
          await $`terminal-notifier -title "OpenCode Complete" -message "Agent finished working!" -sound Glass -timeout 5`
        }

        // Session error - something went wrong
        if (event.type === "session.error") {
          await $`terminal-notifier -title "OpenCode Error" -message "An error occurred during the session" -sound Basso -timeout 5`
        }
      } catch (error) {
        // Silently fail if notifications don't work
        // (e.g., on non-macOS systems or if osascript is not available)
        console.error("Failed to send notification:", error.message)
      }
    },
  }
}
