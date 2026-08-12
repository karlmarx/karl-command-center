// Streamable HTTP MCP server exposing the email-triage tool surface.
//
//                  ┌───────────────────────────────────┐
//   JSON-RPC 2.0   │  /api/mcp  (Next.js route handler)        │
//   POST + Bearer  │                                            │
//   --------------▶│  initialize → capabilities                 │
//                  │  tools/list → schemas                       │
//                  │  tools/call → dispatch → REST/SQL/SMS      │
//                  └───────────────────────────────────┘
//
// See docs/mcp-server.md for connection instructions and diagrams.

import { NextRequest, NextResponse } from "next/server";
import { TOOLS, dispatchTool } from "./tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BEARER = process.env.MCP_BEARER_TOKEN;

type JsonRpcId = string | number | null;

function rpcResult(id: JsonRpcId, result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id, result });
}

function rpcError(id: JsonRpcId, code: number, message: string) {
  return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } });
}

export async function POST(req: NextRequest) {
  if (!BEARER) {
    return NextResponse.json(
      { error: "MCP_BEARER_TOKEN not configured on the server" },
      { status: 500 }
    );
  }

  if (req.headers.get("authorization") !== `Bearer ${BEARER}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { jsonrpc?: string; id?: JsonRpcId; method?: string; params?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const id = body.id ?? null;

  if (body.jsonrpc !== "2.0" || typeof body.method !== "string") {
    return rpcError(id, -32600, "invalid request");
  }

  switch (body.method) {
    case "initialize":
      return rpcResult(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "karl-triage-mcp", version: "0.1.0" },
      });

    case "notifications/initialized":
      return new NextResponse(null, { status: 204 });

    case "tools/list":
      return rpcResult(id, { tools: TOOLS });

    case "tools/call": {
      const params = (body.params as { name?: string; arguments?: Record<string, unknown> }) ?? {};
      const name = params.name;
      if (typeof name !== "string") {
        return rpcError(id, -32602, "params.name required");
      }
      try {
        const result = await dispatchTool(name, params.arguments ?? {});
        return rpcResult(id, {
          content: [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ],
        });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        return rpcResult(id, {
          content: [{ type: "text", text: JSON.stringify({ error: message }) }],
          isError: true,
        });
      }
    }

    case "ping":
      return rpcResult(id, {});

    default:
      return rpcError(id, -32601, `method not found: ${body.method}`);
  }
}

export async function GET() {
  return NextResponse.json({
    name: "karl-triage-mcp",
    version: "0.1.0",
    transport: "Streamable HTTP MCP",
    methods: ["initialize", "tools/list", "tools/call", "ping"],
    tools: TOOLS.map((t) => t.name),
    note: "POST JSON-RPC 2.0 requests with Authorization: Bearer <MCP_BEARER_TOKEN>",
    docs: "https://github.com/karlmarx/karl-command-center/blob/main/docs/mcp-server.md",
  });
}
