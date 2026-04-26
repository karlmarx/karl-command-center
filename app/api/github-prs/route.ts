import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'GITHUB_TOKEN not found' }, { status: 500 });
  }

  try {
    const response = await fetch('https://api.github.com/search/issues?q=author:karlmarx+type:pr+state:open&per_page=30', {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}`);
    }

    const data = await response.json();
    const prs = data.items.map((item: any) => ({
      id: item.id,
      title: item.title,
      url: item.html_url,
      repo: item.repository_url.split('/').slice(-1)[0],
      createdAt: item.created_at,
    }));

    return NextResponse.json(prs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
