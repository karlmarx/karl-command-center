const TOKEN = process.env.GITHUB_TOKEN;

const HEADERS = (): HeadersInit => ({
  authorization: `Bearer ${TOKEN}`,
  accept: "application/vnd.github+json",
  "user-agent": "karl-triage-mcp",
});

export async function createIssue(args: {
  repo: string;
  title: string;
  body: string;
  labels?: string[];
}) {
  if (!TOKEN) throw new Error("GITHUB_TOKEN not configured");
  const res = await fetch(
    `https://api.github.com/repos/${args.repo}/issues`,
    {
      method: "POST",
      headers: { ...HEADERS(), "content-type": "application/json" },
      body: JSON.stringify({
        title: args.title,
        body: args.body,
        labels: args.labels ?? [],
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`github ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { number: number; html_url: string };
  return { number: data.number, url: data.html_url, repo: args.repo };
}

export async function listRecentMerges(args: { repo: string; hours: number }) {
  if (!TOKEN) throw new Error("GITHUB_TOKEN not configured");
  const url = new URL(`https://api.github.com/repos/${args.repo}/pulls`);
  url.searchParams.set("state", "closed");
  url.searchParams.set("base", "main");
  url.searchParams.set("sort", "updated");
  url.searchParams.set("direction", "desc");
  url.searchParams.set("per_page", "20");

  const res = await fetch(url, { headers: HEADERS() });
  if (!res.ok) {
    throw new Error(`github ${res.status}: ${await res.text()}`);
  }
  const prs = (await res.json()) as Array<{
    number: number;
    title: string;
    user: { login: string } | null;
    merged_at: string | null;
    html_url: string;
  }>;
  const cutoff = Date.now() - args.hours * 60 * 60 * 1000;
  const merges = prs
    .filter(
      (p) =>
        p.merged_at !== null &&
        new Date(p.merged_at).getTime() >= cutoff
    )
    .map((p) => ({
      number: p.number,
      title: p.title,
      author: p.user?.login ?? "unknown",
      merged_at: p.merged_at,
      url: p.html_url,
    }));

  return {
    repo: args.repo,
    hours: args.hours,
    count: merges.length,
    merges,
  };
}
