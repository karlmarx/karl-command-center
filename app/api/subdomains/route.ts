import { NextResponse } from 'next/server';

const SUBDOMAINS = [
  { name: 'Root', url: 'https://93.fyi' },
  { name: 'API', url: 'https://api.93.fyi' },
  { name: 'Git', url: 'https://git.93.fyi' },
  { name: 'Docs', url: 'https://docs.93.fyi' },
];

export async function GET() {
  const results = await Promise.all(
    SUBDOMAINS.map(async (sub) => {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(sub.url, {
          method: 'HEAD', // HEAD request is lighter
          signal: controller.signal,
          cache: 'no-store',
        });

        clearTimeout(timeoutId);

        return {
          name: sub.name,
          url: sub.url,
          status: response.ok ? 'up' : 'down',
          latency: Date.now() - start,
        };
      } catch (error) {
        return {
          name: sub.name,
          url: sub.url,
          status: 'down',
          latency: null,
        };
      }
    })
  );

  return NextResponse.json(results);
}
