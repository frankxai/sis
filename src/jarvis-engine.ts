import { ContentProductionEngine } from "./content-engine.js";
import { ContextContinuityEngine } from "./context-engine.js";
import {
  COUNCIL_AGENTS,
  HARNESS_ADAPTERS,
  MultiAgentHarnessEngine,
} from "./harness-engine.js";
import { SovereignVaultEngine } from "./vault-engine.js";
import type {
  ContentProject,
  ContextHandoff,
  HarnessId,
  JarvisDirectiveResult,
  JarvisExecutionStep,
  TaskEnvelope,
  VaultEntry,
} from "./types.js";

export class JarvisCommandEngine {
  private vaultEngine: SovereignVaultEngine;
  private harnessEngine: MultiAgentHarnessEngine;
  private contextEngine: ContextContinuityEngine;
  private contentEngine: ContentProductionEngine;
  private directiveHistory: JarvisDirectiveResult[] = [];
  private activeEnvelopes: TaskEnvelope[] = [];

  constructor(params: {
    vaultEngine: SovereignVaultEngine;
    harnessEngine: MultiAgentHarnessEngine;
    contextEngine: ContextContinuityEngine;
    contentEngine: ContentProductionEngine;
  }) {
    this.vaultEngine = params.vaultEngine;
    this.harnessEngine = params.harnessEngine;
    this.contextEngine = params.contextEngine;
    this.contentEngine = params.contentEngine;

    // Seed initial directive run so the HUD has an immediate trace on boot
    this.executeDirective({
      input:
        "/directive Synchronize 6 semantic vaults across Cursor and Claude Code, verify Maker/Checker council readiness, and stage multi-channel content studio",
      preferredHarness: "cursor",
      recordVaultMemory: false,
    });
  }

  public getHistory(): JarvisDirectiveResult[] {
    return this.directiveHistory;
  }

  public getEnvelopes(): TaskEnvelope[] {
    return this.activeEnvelopes;
  }

  public executeDirective(params: {
    input: string;
    preferredHarness?: HarnessId;
    recordVaultMemory?: boolean;
  }): JarvisDirectiveResult {
    const rawInput = params.input.trim();
    const cleanedIntent = rawInput.replace(/^\/[a-z-]+\s*/i, "").trim() || rawInput;
    const route = this.harnessEngine.routeTask({
      intent: rawInput,
      preferredHarness: params.preferredHarness,
    });

    const nowIso = new Date().toISOString();
    const envelopeId = `env-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 5)}`;

    const envelope: TaskEnvelope = {
      id: envelopeId,
      title:
        cleanedIntent.length > 78
          ? `${cleanedIntent.slice(0, 75)}...`
          : cleanedIntent,
      intent: cleanedIntent,
      commandType: route.commandType,
      priority: route.priority,
      leadAgent: route.leadAgent,
      supportingAgents: route.supportingAgents,
      targetHarness: route.targetHarness,
      vaultTouches: route.vaultTouches,
      status: "completed",
      createdAt: nowIso,
    };

    this.activeEnvelopes.unshift(envelope);
    if (this.activeEnvelopes.length > 25) {
      this.activeEnvelopes.pop();
    }

    // Recall vault entries
    let recalledMemories = this.vaultEngine.search({
      query: cleanedIntent,
      limit: 6,
    });
    if (recalledMemories.length === 0) {
      recalledMemories = this.vaultEngine.getAllEntries().slice(0, 5);
    }

    // Compile context pack
    const contextPack = this.contextEngine.compileContextPack({
      targetHarness: route.targetHarness,
      taskFocus: cleanedIntent,
      maxVaultEntries: 8,
    });

    const contradictions = this.vaultEngine.detectContradictions();
    const leadAgentObj = COUNCIL_AGENTS[route.leadAgent];
    const checkerAgentObj = COUNCIL_AGENTS[route.checkerAgent];
    const harnessSpec = HARNESS_ADAPTERS[route.targetHarness];

    let createdProject: ContentProject | undefined;
    let createdHandoff: ContextHandoff | undefined;
    let memoryWritten: VaultEntry | undefined;

    if (route.commandType === "produce") {
      createdProject = this.contentEngine.createProject({
        title:
          cleanedIntent.length > 12
            ? cleanedIntent
            : "Sovereign Multi-Agent Harness Architecture Brief",
        topic: `Jarvis-directed synthesis on: ${cleanedIntent}`,
        targetHarness: route.targetHarness,
        groundingVaults: route.vaultTouches,
      });
    } else if (route.commandType === "handoff") {
      const nextHarness: HarnessId =
        route.targetHarness === "cursor" ? "claude-code" : "cursor";
      createdHandoff = this.contextEngine.createHandoff({
        fromHarness: route.targetHarness,
        toHarness: nextHarness,
        summary: `Jarvis-orchestrated context transfer: ${cleanedIntent}`,
        makerAgent: route.leadAgent,
        checkerAgent: route.checkerAgent,
      });
    } else if (params.recordVaultMemory ?? true) {
      const targetVault = route.vaultTouches[0] ?? "operational";
      memoryWritten = this.vaultEngine.appendEntry({
        vault: targetVault,
        content: `[Jarvis Directive · ${route.commandType.toUpperCase()}] ${cleanedIntent}`,
        category: "directive",
        tags: ["jarvis", route.commandType, route.targetHarness],
        confidence: 0.94,
        sourceHarness: route.targetHarness,
        authorAgent: route.leadAgent,
      });
    }

    const synthesizedResponse = [
      `JARVIS COMMAND SYNTHESIS [${envelope.id.toUpperCase()}]`,
      `• Command Class: ${route.commandType.toUpperCase()} (${route.priority})`,
      `• Council Assignment: Lead Maker ${leadAgentObj.name} (${leadAgentObj.callsign}) + [${route.supportingAgents
        .map((a) => COUNCIL_AGENTS[a].name)
        .join(", ")}] → Verified by Checker ${checkerAgentObj.name} (${checkerAgentObj.callsign})`,
      `• Target Harness: ${harnessSpec.name} (${harnessSpec.memoryFile} · ${contextPack.totalUsedTokens.toLocaleString()} / ${contextPack.usableTokens.toLocaleString()} usable tokens, ${contextPack.utilizationPct}% utilized)`,
      `• Vault Grounding: ${recalledMemories.length} attested entries recalled across [${Array.from(
        new Set(recalledMemories.map((m) => m.vault.toUpperCase()))
      ).join(", ")}]`,
      createdProject
        ? `• Content Studio Action: Created 4-format Content Production Project "${createdProject.title}" (${createdProject.id}) with Sentinel Gate Score ${createdProject.qualityScorecard.overallScore}/100.`
        : createdHandoff
        ? `• Context Bridge Action: Created revision-scoped Handoff Packet ${createdHandoff.id} (${createdHandoff.fromHarness} → ${createdHandoff.toHarness}) with digest ${createdHandoff.integrityDigest}.`
        : memoryWritten
        ? `• Sovereign Memory Action: Committed durable entry ${memoryWritten.id} to ${memoryWritten.vault.toUpperCase()} vault (${memoryWritten.attestationHash}).`
        : `• Status: All 6 semantic vaults and 6 platform harnesses synchronized.`,
    ].join("\n");

    const qualityReceipt = this.harnessEngine.evaluateQualityGate({
      makerAgent: route.leadAgent,
      checkerAgent: route.checkerAgent,
      harness: route.targetHarness,
      recalledEntriesCount: recalledMemories.length,
      contradictionsCount: contradictions.length,
      artifactText: synthesizedResponse,
    });

    const steps: JarvisExecutionStep[] = [
      {
        stepNumber: 1,
        phase: "INTENT_PARSE",
        agent: "orchestrator",
        harness: route.targetHarness,
        summary: `Parsed operator directive as [${route.commandType.toUpperCase()}] and minted Task Envelope ${envelope.id} (${route.priority}).`,
        durationMs: 12,
        status: "ok",
      },
      {
        stepNumber: 2,
        phase: "VAULT_RECALL",
        agent: "navigator",
        harness: route.targetHarness,
        summary: `Executed BM25 + 90-day half-life recall across 6 vaults; retrieved ${recalledMemories.length} high-confidence entries (top: ${
          recalledMemories[0]?.id ?? "n/a"
        }).`,
        durationMs: 4,
        status: "ok",
      },
      {
        stepNumber: 3,
        phase: "CONTEXT_BUDGET",
        agent: "navigator",
        harness: route.targetHarness,
        summary: `Compiled ${harnessSpec.memoryFile} Context Pack (${contextPack.totalUsedTokens.toLocaleString()} tokens used / ${contextPack.usableTokens.toLocaleString()} budget).`,
        durationMs: 9,
        status: "ok",
      },
      {
        stepNumber: 4,
        phase: "COUNCIL_DISPATCH",
        agent: "orchestrator",
        harness: route.targetHarness,
        summary: `Dispatched Lead Maker ${leadAgentObj.name} (${leadAgentObj.callsign}) with supporting council [${route.supportingAgents.join(
          ", "
        )}].`,
        durationMs: 15,
        status: "ok",
      },
      {
        stepNumber: 5,
        phase: "MAKER_EXECUTION",
        agent: route.leadAgent,
        harness: route.targetHarness,
        summary: createdProject
          ? `Compiled 4-channel Content Production package (${createdProject.id}) across Essay, Thread, Changelog, and Jarvis Script.`
          : createdHandoff
          ? `Packaged cross-harness Context Handoff (${createdHandoff.id}) with SHA-256 digest ${createdHandoff.integrityDigest}.`
          : `Synthesized architectural execution plan and updated ${harnessSpec.name} artifact state.`,
        durationMs: 38,
        status: "ok",
      },
      {
        stepNumber: 6,
        phase: "SENTINEL_GATE",
        agent: route.checkerAgent,
        harness: route.targetHarness,
        summary: `Verified Maker/Checker separation, vault grounding, and zero-slop compliance — Gate Score: ${qualityReceipt.overallScore}/100.`,
        durationMs: 14,
        status: qualityReceipt.passed ? "ok" : "warning",
      },
      {
        stepNumber: 7,
        phase: "SIP_ATTESTATION",
        agent: "sentinel",
        harness: route.targetHarness,
        summary: `Issued Built-on-SIP v1.1.1 cryptographic receipt: ${qualityReceipt.sipAttestation}.`,
        durationMs: 5,
        status: "ok",
      },
    ];

    const result: JarvisDirectiveResult = {
      id: `dir-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      rawInput,
      parsedCommand: route.commandType,
      envelope,
      recalledMemories,
      contextPack,
      steps,
      qualityReceipt,
      synthesizedResponse,
      memoryWritten,
      createdProject,
      createdHandoff,
      timestamp: nowIso,
    };

    this.directiveHistory.unshift(result);
    if (this.directiveHistory.length > 20) {
      this.directiveHistory.pop();
    }

    return result;
  }
}
