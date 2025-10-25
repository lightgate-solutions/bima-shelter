import { upstashIndex } from "@/lib/upstash-client";

export async function POST(req: Request) {
  const { query } = (await req.json()) as { query: string };

  const results = await upstashIndex.search({ query, limit: 50 });

  return new Response(JSON.stringify(results));
}
