import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.CLOUDFLARE_API_KEY;
  const email = process.env.CLOUDFLARE_EMAIL;
  const zoneId = '8881c2fb46004f18cbf6faf47e562731';

  if (!apiKey || !email) {
    return NextResponse.json({ error: 'Cloudflare credentials missing' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?per_page=100`, {
      headers: {
        'X-Auth-Email': email,
        'X-Auth-Key': apiKey,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 } // Cache for 5 mins
    });

    const data = await response.json();
    if (!data.success) throw new Error('Cloudflare API failed');

    const records = data.result
      .filter((r: any) => (r.type === 'A' || r.type === 'CNAME') && r.name.includes('93.fyi'))
      .map((r: any) => ({
        name: r.name.replace('.93.fyi', '').replace('93.fyi', 'root'),
        url: `https://${r.name}`,
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    const results = await Promise.all(
      records.map(async (sub: any) => {
        const start = Date.now();
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          const res = await fetch(sub.url, { method: 'HEAD', signal: controller.signal, cache: 'no-store' });
          clearTimeout(timeoutId);
          return { ...sub, status: res.ok ? 'up' : 'down', latency: Date.now() - start };
        } catch {
          return { ...sub, status: 'down', latency: null };
        }
      })
    );

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
