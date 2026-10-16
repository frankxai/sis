import { existsSync, readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createSisNexusRuntime, type SisNexusRuntime } from "./index.js";
import type {
  AgentId,
  ContentStage,
  EntryCategory,
  HarnessId,
  VaultType,
} from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolvePromise, rejectPromise) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        resolvePromise({});
        return;
      }
      try {
        resolvePromise(JSON.parse(raw) as Record<string, unknown>);
      } catch (err) {
        rejectPromise(err);
      }
    });
    req.on("error", rejectPromise);
  });
}

export function createAppServer(runtime: SisNexusRuntime = createSisNexusRuntime()) {
  const publicDir = existsSync(join(__dirname, "public"))
    ? join(__dirname, "public")
    : resolve(__dirname, "..", "src", "public");

  const server = createServer(async (req, res) => {
    try {
      const method = req.method ?? "GET";
      const parsedUrl = new URL(req.url ?? "/", "http://localhost");
      const pathname = parsedUrl.pathname;

      if (method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        });
        res.end();
        return;
      }

      // --- REST API ROUTES ---
      if (pathname === "/api/health" && method === "GET") {
        sendJson(res, 200, {
          status: "ok",
          system: "SIS Nexus — Multi-Agent Harness & Jarvis Command Core",
          protocol: "SIP-v1.1.1",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (pathname === "/api/overview" && method === "GET") {
        const vaultStats = runtime.vaultEngine.getStats();
        const agents = runtime.harnessEngine.getAgents();
        const harnesses = runtime.harnessEngine.getHarnesses();
        const contradictions = runtime.vaultEngine.detectContradictions();
        const handoffs = runtime.contextEngine.getHandoffs();
        const projects = runtime.contentEngine.getProjects();
        const directives = runtime.jarvisEngine.getHistory();
        const contextPack = runtime.contextEngine.compileContextPack({
          targetHarness: "cursor",
        });

        sendJson(res, 200, {
          protocol: "SIP-v1.1.1",
          engineVersion: "8.5.1-nexus",
          vaultStats,
          agents,
          harnesses,
          contradictions,
          handoffs,
          projects,
          directives,
          defaultContextPack: contextPack,
        });
        return;
      }

      if (pathname === "/api/vaults" && method === "GET") {
        const vault = parsedUrl.searchParams.get("vault") as VaultType | null;
        const query = parsedUrl.searchParams.get("q") ?? "";
        const tag = parsedUrl.searchParams.get("tag");
        const entries = query.trim() || tag
          ? runtime.vaultEngine.search({
              query,
              vault: vault ?? undefined,
              tags: tag ? [tag] : undefined,
              limit: 50,
            })
          : runtime.vaultEngine.getAllEntries({
              vault: vault ?? undefined,
            });
        sendJson(res, 200, {
          stats: runtime.vaultEngine.getStats(),
          entries,
          contradictions: runtime.vaultEngine.detectContradictions(),
        });
        return;
      }

      if (pathname === "/api/vaults/entries" && method === "POST") {
        const body = await readJsonBody(req);
        const content = String(body.content ?? "").trim();
        const vault = (body.vault as VaultType) || "technical";
        if (!content) {
          sendJson(res, 400, { error: "content is required" });
          return;
        }
        const rawTags = body.tags;
        const tags = Array.isArray(rawTags)
          ? rawTags.map((t) => String(t))
          : typeof rawTags === "string"
          ? rawTags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined;

        const created = runtime.vaultEngine.appendEntry({
          vault,
          content,
          category: (body.category as EntryCategory) || "pattern",
          tags,
          confidence: body.confidence ? Number(body.confidence) : 0.95,
          sourceHarness: (body.sourceHarness as HarnessId) || "cursor",
          authorAgent: (body.authorAgent as AgentId) || "orchestrator",
        });

        sendJson(res, 201, {
          entry: created,
          stats: runtime.vaultEngine.getStats(),
          contradictions: runtime.vaultEngine.detectContradictions(),
        });
        return;
      }

      const confirmMatch = pathname.match(/^\/api\/vaults\/([^/]+)\/confirm$/);
      if (confirmMatch && method === "POST") {
        const id = decodeURIComponent(confirmMatch[1]);
        const updated = runtime.vaultEngine.confirmEntry(id);
        if (!updated) {
          sendJson(res, 404, { error: `Entry ${id} not found` });
          return;
        }
        sendJson(res, 200, {
          entry: updated,
          stats: runtime.vaultEngine.getStats(),
          contradictions: runtime.vaultEngine.detectContradictions(),
        });
        return;
      }

      const invalidateMatch = pathname.match(/^\/api\/vaults\/([^/]+)\/invalidate$/);
      if (invalidateMatch && method === "POST") {
        const id = decodeURIComponent(invalidateMatch[1]);
        const updated = runtime.vaultEngine.invalidateEntry(id);
        if (!updated) {
          sendJson(res, 404, { error: `Entry ${id} not found` });
          return;
        }
        sendJson(res, 200, {
          entry: updated,
          stats: runtime.vaultEngine.getStats(),
          contradictions: runtime.vaultEngine.detectContradictions(),
        });
        return;
      }

      if (pathname === "/api/context/compile" && method === "POST") {
        const body = await readJsonBody(req);
        const pack = runtime.contextEngine.compileContextPack({
          targetHarness: (body.targetHarness as HarnessId) || "cursor",
          taskFocus: body.taskFocus ? String(body.taskFocus) : undefined,
          allocation: body.allocation as Record<string, number> | undefined,
          maxVaultEntries: body.maxVaultEntries
            ? Number(body.maxVaultEntries)
            : 10,
        });
        sendJson(res, 200, { contextPack: pack });
        return;
      }

      if (pathname === "/api/context/handoffs" && method === "GET") {
        sendJson(res, 200, { handoffs: runtime.contextEngine.getHandoffs() });
        return;
      }

      if (pathname === "/api/context/handoffs" && method === "POST") {
        const body = await readJsonBody(req);
        const summary = String(body.summary ?? "").trim();
        if (!summary) {
          sendJson(res, 400, { error: "summary is required" });
          return;
        }
        const handoff = runtime.contextEngine.createHandoff({
          fromHarness: (body.fromHarness as HarnessId) || "claude-code",
          toHarness: (body.toHarness as HarnessId) || "cursor",
          repository: body.repository ? String(body.repository) : undefined,
          branch: body.branch ? String(body.branch) : undefined,
          revisionSha: body.revisionSha ? String(body.revisionSha) : undefined,
          summary,
          completedObjectives: Array.isArray(body.completedObjectives)
            ? body.completedObjectives.map(String)
            : undefined,
          pendingTasks: Array.isArray(body.pendingTasks)
            ? body.pendingTasks.map(String)
            : undefined,
          modifiedFiles: Array.isArray(body.modifiedFiles)
            ? body.modifiedFiles.map(String)
            : undefined,
          makerAgent: (body.makerAgent as AgentId) || "navigator",
          checkerAgent: (body.checkerAgent as AgentId) || "sentinel",
        });
        sendJson(res, 201, {
          handoff,
          handoffs: runtime.contextEngine.getHandoffs(),
        });
        return;
      }

      if (pathname === "/api/jarvis/command" && method === "POST") {
        const body = await readJsonBody(req);
        const input = String(body.input ?? "").trim();
        if (!input) {
          sendJson(res, 400, { error: "input directive is required" });
          return;
        }
        const result = runtime.jarvisEngine.executeDirective({
          input,
          preferredHarness: (body.preferredHarness as HarnessId) || undefined,
          recordVaultMemory: body.recordVaultMemory !== false,
        });
        sendJson(res, 200, {
          result,
          history: runtime.jarvisEngine.getHistory(),
          vaultStats: runtime.vaultEngine.getStats(),
          projects: runtime.contentEngine.getProjects(),
          handoffs: runtime.contextEngine.getHandoffs(),
        });
        return;
      }

      if (pathname === "/api/content" && method === "GET") {
        sendJson(res, 200, {
          projects: runtime.contentEngine.getProjects(),
        });
        return;
      }

      if (pathname === "/api/content" && method === "POST") {
        const body = await readJsonBody(req);
        const title = String(body.title ?? "").trim();
        const topic = String(body.topic ?? "").trim();
        if (!title || !topic) {
          sendJson(res, 400, { error: "title and topic are required" });
          return;
        }
        const project = runtime.contentEngine.createProject({
          title,
          topic,
          audience: body.audience ? String(body.audience) : undefined,
          pillar: body.pillar as
            | "Harness Engineering"
            | "Sovereign Memory"
            | "Jarvis Systems"
            | "Agentic Content Ops"
            | undefined,
          targetHarness: (body.targetHarness as HarnessId) || "cursor",
          groundingVaults: Array.isArray(body.groundingVaults)
            ? (body.groundingVaults as VaultType[])
            : undefined,
        });
        sendJson(res, 201, {
          project,
          projects: runtime.contentEngine.getProjects(),
        });
        return;
      }

      const advanceMatch = pathname.match(/^\/api\/content\/([^/]+)\/advance$/);
      if (advanceMatch && method === "POST") {
        const id = decodeURIComponent(advanceMatch[1]);
        const body = await readJsonBody(req);
        const updated = runtime.contentEngine.advanceStage(
          id,
          body.targetStage as ContentStage | undefined
        );
        if (!updated) {
          sendJson(res, 404, { error: `Project ${id} not found` });
          return;
        }
        sendJson(res, 200, {
          project: updated,
          projects: runtime.contentEngine.getProjects(),
          vaultStats: runtime.vaultEngine.getStats(),
        });
        return;
      }

      // --- STATIC ASSETS ---
      const cleanPath = pathname === "/" ? "/index.html" : pathname;
      const safeRelPath = cleanPath.replace(/^\/+/, "");
      const candidatePath = resolve(publicDir, safeRelPath);

      if (
        candidatePath.startsWith(publicDir) &&
        existsSync(candidatePath)
      ) {
        const ext = extname(candidatePath);
        const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
        const content = readFileSync(candidatePath);
        res.writeHead(200, {
          "Content-Type": contentType,
          "Cache-Control": "no-cache",
        });
        res.end(content);
        return;
      }

      // SPA fallback to index.html
      const indexHtmlPath = join(publicDir, "index.html");
      if (existsSync(indexHtmlPath)) {
        const content = readFileSync(indexHtmlPath);
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(content);
        return;
      }

      sendJson(res, 404, { error: "Not found" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal server error";
      sendJson(res, 500, { error: message });
    }
  });

  return { server, runtime };
}

// Start server when invoked directly
const isDirectExecution =
  process.argv[1] &&
  resolve(process.argv[1]).endsWith("server.js");

if (isDirectExecution) {
  const port = Number(process.env.PORT ?? 4173);
  const host = process.env.HOST ?? "0.0.0.0";
  const { server } = createAppServer();
  server.listen(port, host, () => {
    console.log(
      `[SIS Nexus] Starlight Multi-Agent Harness & Jarvis Command Center online at http://localhost:${port}`
    );
  });
}
