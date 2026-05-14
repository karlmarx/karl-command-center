import { createIssue, listRecentMerges } from "@/lib/triage-adapters/github";
import { lookupUserActivity } from "@/lib/triage-adapters/nwbfit";
import { createTask } from "@/lib/triage-adapters/todoist";
import { sendSms } from "@/lib/triage-adapters/twilio";

// Repos the agent can query for recent merges or file issues in. Frozen at
// build time so a hallucinated repo name in tools/call can't trigger
// arbitrary cross-org fetches.
const ALLOWED_REPOS = new Set([
  "karlmarx/nwb-plan",
  "karlmarx/nwb-yoga",
  "karlmarx/foodr",
  "karlmarx/identity-verification",
  "karlmarx/karl-command-center",
  "karlmarx/karl-infra",
  "karlmarx/blazing-paddles-react",
  "karlmarx/mom-93fyi",
  "karlmarx/93-fyi",
  "karlmarx/me-93fyi",
  "karlmarx/paperclip-sandbox",
]);

export const TOOLS = [
  {
    name: "github_create_issue",
    description:
      "Create a GitHub issue in a karlmarx/* repo. Use for bug reports, feature requests, or code action items.",
    inputSchema: {
      type: "object",
      properties: {
        repo: {
          type: "string",
          description: "owner/repo, e.g. karlmarx/nwb-plan",
        },
        title: { type: "string" },
        body: { type: "string" },
        labels: { type: "array", items: { type: "string" } },
      },
      required: ["repo", "title", "body"],
    },
  },
  {
    name: "github_recent_merges",
    description:
      "List PRs merged to main in a karlmarx/* repo within the last N hours. Use to find suspect deploys when something just broke.",
    inputSchema: {
      type: "object",
      properties: {
        repo: { type: "string", description: "owner/repo" },
        hours: { type: "integer", description: "Lookback window, default 48" },
      },
      required: ["repo"],
    },
  },
  {
    name: "todoist_create_task",
    description:
      "Create a Todoist task for Karl. Priority 1=lowest, 4=highest. due_string accepts natural language ('tomorrow 9am', 'next friday').",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Short title" },
        description: { type: "string" },
        priority: { type: "integer", enum: [1, 2, 3, 4] },
        due_string: { type: "string" },
      },
      required: ["content"],
    },
  },
  {
    name: "twilio_send_urgent_sms",
    description:
      "Send an SMS to Karl's phone. Use ONLY for truly urgent messages. <=160 chars.",
    inputSchema: {
      type: "object",
      properties: {
        body: { type: "string", description: "<=160 chars" },
      },
      required: ["body"],
    },
  },
  {
    name: "lookup_nwbfit_user_activity",
    description:
      "Look up a user's NWB Fit activity by email. Returns total workouts, last workout timestamp, 7d/30d counts.",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string" },
      },
      required: ["email"],
    },
  },
] as const;

export async function dispatchTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case "github_create_issue": {
      const repo = String(args.repo ?? "");
      if (!ALLOWED_REPOS.has(repo)) {
        throw new Error(`repo ${repo} not in allowlist`);
      }
      return await createIssue({
        repo,
        title: String(args.title ?? ""),
        body: String(args.body ?? ""),
        labels: Array.isArray(args.labels)
          ? (args.labels as string[])
          : undefined,
      });
    }
    case "github_recent_merges": {
      const repo = String(args.repo ?? "");
      if (!ALLOWED_REPOS.has(repo)) {
        throw new Error(`repo ${repo} not in allowlist`);
      }
      return await listRecentMerges({
        repo,
        hours: Number(args.hours ?? 48),
      });
    }
    case "todoist_create_task":
      return await createTask({
        content: String(args.content ?? ""),
        description: args.description ? String(args.description) : undefined,
        priority:
          typeof args.priority === "number" ? args.priority : undefined,
        dueString: args.due_string ? String(args.due_string) : undefined,
      });
    case "twilio_send_urgent_sms":
      return await sendSms(String(args.body ?? ""));
    case "lookup_nwbfit_user_activity":
      return await lookupUserActivity(String(args.email ?? ""));
    default:
      throw new Error(`unknown tool: ${name}`);
  }
}
