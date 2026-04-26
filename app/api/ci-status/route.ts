import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'GITHUB_TOKEN not found' }, { status: 500 });
  }

  try {
    // 1. Get all recent active repos for the user
    const reposRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=12', {
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
      next: { revalidate: 600 }
    });
    
    if (!reposRes.ok) throw new Error('Failed to fetch repos');
    const repos = await reposRes.json();

    // 2. Fetch CI status for each repo
    const results = await Promise.all(
      repos.map(async (repo: any) => {
        const response = await fetch(`https://api.github.com/repos/${repo.full_name}/actions/runs?per_page=1`, {
          headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
          next: { revalidate: 60 }
        });

        if (!response.ok) return null;

        const data = await response.json();
        const latestRun = data.workflow_runs[0];

        if (!latestRun) return null;

        return {
          repo: repo.name,
          id: latestRun.id,
          name: latestRun.name,
          status: latestRun.status,
          conclusion: latestRun.conclusion,
          url: latestRun.html_url,
          createdAt: latestRun.created_at,
        };
      })
    );

    return NextResponse.json(results.filter(r => r !== null));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
