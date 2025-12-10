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
        // Permission requested - agent needs approval
        if (event.type === "permission.updated") {
          await $`osascript -e 'display notification "Agent requesting permission to make changes" with title "OpenCode Permission" sound name "Glass"'`
        }

        // Session idle - agent finished working
        if (event.type === "session.idle") {
          await $`osascript -e 'display notification "Agent finished working!" with title "OpenCode Complete" sound name "Glass"'`
        }

        // Session error - something went wrong
        if (event.type === "session.error") {
          await $`osascript -e 'display notification "An error occurred during the session" with title "OpenCode Error" sound name "Basso"'`
        }
      } catch (error) {
        // Silently fail if notifications don't work
        // (e.g., on non-macOS systems or if osascript is not available)
        console.error("Failed to send notification:", error.message)
      }
    },
  }
}
