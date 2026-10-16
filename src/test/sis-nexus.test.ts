import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  computeTemporalConfidence,
  createSisNexusRuntime,
  SovereignVaultEngine,
} from "../index.js";
import { createAppServer } from "../server.js";

describe("SIS Nexus — Sovereign 6-Vault Memory Engine", () => {
  it("seeds all 6 semantic vaults and computes 90-day half-life decay", () => {
    const engine = new SovereignVaultEngine();
    const stats = engine.getStats();

    assert.ok(stats.activeEntries >= 14);
    assert.ok(stats.byVault.strategic.count >= 2);
    assert.ok(stats.byVault.technical.count >= 3);
    assert.ok(stats.byVault.creative.count >= 2);
    assert.ok(stats.byVault.operational.count >= 2);
    assert.ok(stats.byVault.wisdom.count >= 2);
    assert.ok(stats.byVault.horizon.count >= 2);

    const nowMs = Date.parse("2026-10-16T00:00:00.000Z");
    const ninetyDaysEarlier = new Date(nowMs - 90 * 86400_000).toISOString();
    const decay = computeTemporalConfidence(1.0, ninetyDaysEarlier, nowMs, 90);
    assert.equal(decay.daysSinceConfirmed, 90);
    assert.equal(decay.effectiveConfidence, 0.5);
  });

  it("ranks fresh confirmed entries above stale entries via BM25 + temporal decay and detects contradictions", () => {
    const engine = new SovereignVaultEngine();
    const results = engine.search({ query: "BM25 lexical scoring vault recall" });

    assert.ok(results.length >= 2);
    assert.equal(results[0].id, "mem-tech-001");

    const contradictions = engine.detectContradictions();
    assert.ok(contradictions.length >= 2);
    const hasBm25Conflict = contradictions.some(
      (c) =>
        (c.entryA.id === "mem-tech-001" && c.entryB.id === "mem-tech-003") ||
        (c.entryA.id === "mem-tech-003" && c.entryB.id === "mem-tech-001")
    );
    assert.equal(hasBm25Conflict, true);

    // Invalidating the stale conflicting entry resolves that contradiction
    engine.invalidateEntry("mem-tech-003");
    const afterContradictions = engine.detectContradictions();
    assert.equal(afterContradictions.length, contradictions.length - 1);
  });

  it("persists and reloads JSONL vaults on disk", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "sis-vaults-"));
    try {
      const writer = new SovereignVaultEngine({ vaultDir: tempDir });
      const appended = writer.appendEntry({
        vault: "horizon",
        content: "Persist sovereign multi-agent state across restarts",
        tags: ["persistence", "jsonl"],
      });

      const reader = new SovereignVaultEngine({
        vaultDir: tempDir,
        seedDefaults: false,
      });
      const hits = reader.search({ query: "Persist sovereign multi-agent" });
      assert.ok(hits.some((h) => h.id === appended.id));
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("SIS Nexus — Multi-Agent Harness, Context Continuity & Content Studio", () => {
  it("compiles token-budgeted Context Packs and platform contracts across harnesses", () => {
    const runtime = createSisNexusRuntime();
    const cursorPack = runtime.contextEngine.compileContextPack({
      targetHarness: "cursor",
      taskFocus: "Multi-agent context bridge and Maker/Checker verification",
    });

    assert.equal(cursorPack.targetHarness, "cursor");
    assert.equal(cursorPack.compiledArtifact.memoryFileName, ".cursorrules");
    assert.equal(cursorPack.sections.length, 4);
    assert.ok(cursorPack.totalUsedTokens <= cursorPack.usableTokens);
    assert.ok(
      cursorPack.compiledArtifact.memoryFileContent.includes(
        "Starlight Intelligence System"
      )
    );

    const codexPack = runtime.contextEngine.compileContextPack({
      targetHarness: "codex",
      taskFocus: "Sandbox verification",
    });
    assert.equal(codexPack.compiledArtifact.memoryFileName, "AGENTS.md");
    assert.ok(
      codexPack.compiledArtifact.mcpConfigContent.includes(
        "[mcp_servers.starlight_nexus]"
      )
    );
  });

  it("executes Jarvis directives with Maker/Checker separation and orchestrates Content Studio runs", () => {
    const runtime = createSisNexusRuntime();

    const produceRes = runtime.jarvisEngine.executeDirective({
      input:
        "/produce Engineering Zero-Drift Multi-Agent Harnesses with Shared Vaults",
      preferredHarness: "claude-code",
    });

    assert.equal(produceRes.parsedCommand, "produce");
    assert.equal(produceRes.steps.length, 7);
    assert.equal(produceRes.qualityReceipt.passed, true);
    assert.notEqual(
      produceRes.qualityReceipt.makerAgent,
      produceRes.qualityReceipt.checkerAgent
    );
    assert.ok(produceRes.createdProject);
    assert.ok(
      produceRes.createdProject.outputs["technical-essay"].includes(
        "Built on SIP"
      )
    );
    assert.ok(
      produceRes.createdProject.outputs["social-thread"].includes("1/6")
    );
    assert.ok(
      produceRes.createdProject.outputs["jarvis-briefing-script"].includes(
        "[HUD TELEMETRY"
      )
    );

    // Advance project stage to published
    const advanced = runtime.contentEngine.advanceStage(
      produceRes.createdProject.id,
      "published"
    );
    assert.ok(advanced);
    assert.equal(advanced.stage, "published");
  });
});

describe("SIS Nexus — Full-Stack HTTP Server & REST API", () => {
  it("serves REST API endpoints and static Web Command Center UI", async () => {
    const { server } = createAppServer();
    await new Promise<void>((resolvePromise) =>
      server.listen(0, "127.0.0.1", resolvePromise)
    );
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;

    try {
      const healthRes = await fetch(`${baseUrl}/api/health`);
      assert.equal(healthRes.status, 200);
      const health = (await healthRes.json()) as { status: string; protocol: string };
      assert.equal(health.status, "ok");
      assert.equal(health.protocol, "SIP-v1.1.1");

      const overviewRes = await fetch(`${baseUrl}/api/overview`);
      assert.equal(overviewRes.status, 200);
      const overview = (await overviewRes.json()) as {
        agents: unknown[];
        harnesses: unknown[];
        projects: unknown[];
      };
      assert.equal(overview.agents.length, 7);
      assert.equal(overview.harnesses.length, 6);
      assert.ok(overview.projects.length >= 3);

      const jarvisRes = await fetch(`${baseUrl}/api/jarvis/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: "/handoff Transfer verified state from Cursor to Codex",
          preferredHarness: "cursor",
        }),
      });
      assert.equal(jarvisRes.status, 200);
      const jarvisData = (await jarvisRes.json()) as {
        result: { parsedCommand: string; createdHandoff?: { id: string } };
      };
      assert.equal(jarvisData.result.parsedCommand, "handoff");
      assert.ok(jarvisData.result.createdHandoff?.id);

      const htmlRes = await fetch(`${baseUrl}/`);
      assert.equal(htmlRes.status, 200);
      const htmlText = await htmlRes.text();
      assert.ok(htmlText.includes("SIS NEXUS"));
      assert.ok(htmlText.includes("Jarvis Command Deck"));
    } finally {
      await new Promise<void>((resolvePromise) =>
        server.close(() => resolvePromise())
      );
    }
  });
});
