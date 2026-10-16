#!/usr/bin/env node
import { createSisNexusRuntime } from "./index.js";
import type { HarnessId } from "./types.js";

const runtime = createSisNexusRuntime();
const [, , subcommand = "status", ...rest] = process.argv;

switch (subcommand) {
  case "status": {
    const stats = runtime.vaultEngine.getStats();
    const agents = runtime.harnessEngine.getAgents();
    const harnesses = runtime.harnessEngine.getHarnesses();
    console.log("================================================================");
    console.log("  SIS NEXUS · STARLIGHT MULTI-AGENT HARNESS & JARVIS SUBSTRATE  ");
    console.log("================================================================");
    console.log(
      `Protocol: SIP-v1.1.1 | Active Vault Entries: ${stats.activeEntries} | Avg Confidence: ${(
        stats.avgEffectiveConfidence * 100
      ).toFixed(1)}% | Contradictions: ${stats.contradictionCount}`
    );
    console.log("\nSix Semantic Vaults:");
    for (const v of Object.values(stats.byVault)) {
      console.log(
        `  ${v.meta.symbol} ${v.meta.name.padEnd(18)} ${String(v.count).padStart(
          2
        )} entries (avg eff. conf: ${(v.avgConfidence * 100).toFixed(0)}%)`
      );
    }
    console.log(
      `\nCouncil Agents (${agents.length}): ${agents
        .map((a) => `${a.name} [${a.callsign}]`)
        .join(", ")}`
    );
    console.log(
      `Platform Harnesses (${harnesses.length}): ${harnesses
        .map((h) => `${h.name} (${h.memoryFile})`)
        .join(", ")}`
    );
    break;
  }
  case "search": {
    const query = rest.join(" ") || "harness memory";
    const hits = runtime.vaultEngine.search({ query, limit: 5 });
    console.log(`Vault Recall for "${query}" (${hits.length} hits):`);
    for (const hit of hits) {
      console.log(
        `  [${hit.id}] (${hit.vault.toUpperCase()} · score=${hit.relevanceScore} · effConf=${hit.effectiveConfidence}) ${hit.content}`
      );
    }
    break;
  }
  case "directive": {
    const input =
      rest.join(" ") ||
      "/directive Audit vault contradictions and prepare multi-harness context pack";
    const res = runtime.jarvisEngine.executeDirective({ input });
    console.log(res.synthesizedResponse);
    console.log(
      `\nGate Score: ${res.qualityReceipt.overallScore}/100 | Receipt: ${res.qualityReceipt.sipAttestation}`
    );
    break;
  }
  case "compile": {
    const harness = (rest[0] as HarnessId) || "cursor";
    const focus = rest.slice(1).join(" ") || "Multi-agent harness orchestration";
    const pack = runtime.contextEngine.compileContextPack({
      targetHarness: harness,
      taskFocus: focus,
    });
    console.log(pack.compiledArtifact.memoryFileContent);
    break;
  }
  default: {
    console.log(
      "Usage: sis-nexus [status | search <query> | directive <intent> | compile <harness> [focus]]"
    );
  }
}
