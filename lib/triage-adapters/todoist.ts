const TOKEN = process.env.TODOIST_TOKEN;

export async function createTask(args: {
  content: string;
  description?: string;
  priority?: number;
  dueString?: string;
}) {
  if (!TOKEN) throw new Error("TODOIST_TOKEN not configured");
  const res = await fetch("https://api.todoist.com/rest/v2/tasks", {
    method: "POST",
    headers: {
      authorization: `Bearer ${TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      content: args.content,
      description: args.description,
      priority: args.priority,
      due_string: args.dueString,
    }),
  });
  if (!res.ok) {
    throw new Error(`todoist ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { id: string; url: string };
  return { id: data.id, url: data.url };
}
