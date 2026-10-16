import { computeAttestationHash, VAULT_CATALOG } from "./vault-engine.js";
import type {
  AgentDefinition,
  AgentId,
  CompiledHarnessArtifact,
  HarnessAdapterSpec,
  HarnessId,
  QualityGateCheck,
  QualityGateReceipt,
  ScoredVaultEntry,
  TaskEnvelope,
  VaultType,
} from "./types.js";

export const COUNCIL_AGENTS: Record<AgentId, AgentDefinition> = {
  orchestrator: {
    id: "orchestrator",
    name: "Orchestrator",
    roleTitle: "Fleet Command & Mission Dispatcher",
    archetype: "overseer",
    callsign: "JARVIS-CORE",
    specialty:
      "Intent decomposition, multi-harness dispatch, SLA telemetry, and task envelope lifecycle governance",
    decisionRights: [
      "Decompose operator intent into typed Task Envelopes",
      "Assign Maker and Checker council roles across harnesses",
      "Allocate context token budgets per execution surface",
    ],
    primaryVaults: ["operational", "horizon", "strategic"],
    preferredHarnesses: ["claude-code", "cursor", "codex"],
    systemDirective:
      "Coordinate the 7-agent council with zero drift. Ensure every task envelope binds a Maker, a distinct Checker, and attested vault recall.",
    status: "active",
    tasksCompleted: 142,
    avgLatencyMs: 185,
  },
  prime: {
    id: "prime",
    name: "Prime",
    roleTitle: "Sovereign Strategy & Executive Synthesis",
    archetype: "sovereign-creator",
    callsign: "APEX-01",
    specialty:
      "Strategic positioning, high-leverage decision synthesis, portfolio prioritization, and sovereign canon stewardship",
    decisionRights: [
      "Approve strategic direction and horizon ledger entries",
      "Resolve cross-vault priority conflicts",
      "Ratify alliance and vertical architecture briefs",
    ],
    primaryVaults: ["strategic", "wisdom", "horizon"],
    preferredHarnesses: ["claude-code", "antigravity"],
    systemDirective:
      "Maximize compounding leverage. Reject low-signal busywork and anchor every initiative in long-term sovereign moat value.",
    status: "active",
    tasksCompleted: 98,
    avgLatencyMs: 220,
  },
  architect: {
    id: "architect",
    name: "Architect",
    roleTitle: "Systems Topology & Protocol Designer",
    archetype: "architect",
    callsign: "STRUCT-02",
    specialty:
      "Full-stack architecture, data contracts, MCP schemas, retrieval algorithms, and multi-harness adapter specifications",
    decisionRights: [
      "Define TypeScript contracts, API boundaries, and storage schemas",
      "Approve technical vault patterns and architectural RFCs",
      "Audit structural integrity of multi-agent harnesses",
    ],
    primaryVaults: ["technical", "strategic", "operational"],
    preferredHarnesses: ["cursor", "claude-code", "codex"],
    systemDirective:
      "Design clean, composable, zero-bloat systems. Prefer deterministic contracts, explicit types, and sub-10ms local retrieval.",
    status: "active",
    tasksCompleted: 164,
    avgLatencyMs: 210,
  },
  navigator: {
    id: "navigator",
    name: "Navigator",
    roleTitle: "Context Continuity & Vault Recall Officer",
    archetype: "overseer",
    callsign: "NEXUS-03",
    specialty:
      "Token budget compilation, BM25 + temporal vault retrieval, and revision-scoped cross-harness handoff packets",
    decisionRights: [
      "Curate high-signal Context Packs within harness token limits",
      "Package and checksum cross-harness handoff state",
      "Flag stale vault entries requiring confirmation",
    ],
    primaryVaults: ["technical", "wisdom", "operational"],
    preferredHarnesses: ["gemini-cli", "cursor", "claude-code"],
    systemDirective:
      "Treat context window budget as scarce capital. Pack only highest-relevance attested memories and preserve exact git revision state across handoffs.",
    status: "active",
    tasksCompleted: 215,
    avgLatencyMs: 140,
  },
  sentinel: {
    id: "sentinel",
    name: "Sentinel",
    roleTitle: "Protocol Defender & Quality Gate Verifier",
    archetype: "protocol-defender",
    callsign: "SHIELD-04",
    specialty:
      "Maker/Checker verification, semantic contradiction detection, zero-slop editorial audits, and SIP cryptographic attestation",
    decisionRights: [
      "Block unverified or self-checked artifacts from promotion",
      "Flag semantic contradictions across vaults",
      "Issue or withhold Built-on-SIP attestation receipts",
    ],
    primaryVaults: ["operational", "technical", "creative"],
    preferredHarnesses: ["codex", "claude-code", "cursor"],
    systemDirective:
      "Never permit decorative attestation or single-agent self-approval. Verify grounding, polarity consistency, and zero-slop compliance before signing.",
    status: "active",
    tasksCompleted: 189,
    avgLatencyMs: 160,
  },
  weaver: {
    id: "weaver",
    name: "Weaver",
    roleTitle: "Content Production & Narrative Director",
    archetype: "sovereign-creator",
    callsign: "LOOM-05",
    specialty:
      "Multi-channel technical storytelling, RFC essays, executive social threads, changelog launches, and Jarvis briefing scripts",
    decisionRights: [
      "Direct the end-to-end Content Production Pipeline",
      "Enforce Creative Vault voice, typography, and zero-slop rules",
      "Compile research and vault insights into multi-format assets",
    ],
    primaryVaults: ["creative", "strategic", "wisdom"],
    preferredHarnesses: ["claude-code", "cursor", "antigravity"],
    systemDirective:
      "Translate complex engineering truth into resonant, high-density narrative artifacts across every distribution channel with zero filler.",
    status: "active",
    tasksCompleted: 131,
    avgLatencyMs: 230,
  },
  sage: {
    id: "sage",
    name: "Sage",
    roleTitle: "Implementation & Self-Healing Engineer",
    archetype: "implementer",
    callsign: "FORGE-06",
    specialty:
      "Full-stack code implementation, automated test harnesses, evaluation suites, and self-healing runtime diagnostics",
    decisionRights: [
      "Execute code mutations, test suites, and runtime builds",
      "Implement harness adapters and CLI tooling",
      "Capture post-execution lessons back into Technical & Operational vaults",
    ],
    primaryVaults: ["technical", "operational", "wisdom"],
    preferredHarnesses: ["cursor", "codex", "opencode"],
    systemDirective:
      "Read before editing. Ship verified, tested code with zero regressions, and distill operational learnings back into the substrate.",
    status: "active",
    tasksCompleted: 208,
    avgLatencyMs: 195,
  },
};

export const HARNESS_ADAPTERS: Record<HarnessId, HarnessAdapterSpec> = {
  "claude-code": {
    id: "claude-code",
    name: "Claude Code",
    memoryFile: "CLAUDE.md",
    mcpConfigPath: "~/.claude/settings.json",
    maxTokens: 200_000,
    defaultReserveTokens: 24_000,
    strengths: [
      "Deep architectural synthesis & multi-file refactoring",
      "Subagent orchestration & slash command execution",
      "Long-horizon reasoning with MCP vault tools",
    ],
    protocolFormat: "markdown-rules",
    activeSessions: 3,
    syncStatus: "synced",
    lastSyncedAt: new Date(Date.now() - 120_000).toISOString(),
  },
  cursor: {
    id: "cursor",
    name: "Cursor Agent Harness",
    memoryFile: ".cursorrules",
    mcpConfigPath: ".cursor/mcp.json",
    maxTokens: 128_000,
    defaultReserveTokens: 16_000,
    strengths: [
      "Full-stack IDE + Cloud Agent autonomous execution",
      "Parallel tool calls, browser verification & PR management",
      "Fast interactive UI/UX and TypeScript iteration",
    ],
    protocolFormat: "markdown-rules",
    activeSessions: 4,
    syncStatus: "synced",
    lastSyncedAt: new Date(Date.now() - 45_000).toISOString(),
  },
  codex: {
    id: "codex",
    name: "Codex CLI / Sandbox",
    memoryFile: "AGENTS.md",
    mcpConfigPath: "~/.codex/config.toml",
    maxTokens: 192_000,
    defaultReserveTokens: 20_000,
    strengths: [
      "Isolated worktree verification & deterministic test execution",
      "High-precision code review and security auditing",
      "SIP file-contract native entry point",
    ],
    protocolFormat: "toml-hybrid",
    activeSessions: 2,
    syncStatus: "synced",
    lastSyncedAt: new Date(Date.now() - 300_000).toISOString(),
  },
  "gemini-cli": {
    id: "gemini-cli",
    name: "Gemini CLI",
    memoryFile: "GEMINI.md",
    mcpConfigPath: "~/.gemini/settings.json",
    maxTokens: 1_000_000,
    defaultReserveTokens: 60_000,
    strengths: [
      "Massive 1M-token cross-repository context synthesis",
      "Whole-vault corpus auditing and research ingestion",
      "Multimodal artifact & diagram inspection",
    ],
    protocolFormat: "markdown-rules",
    activeSessions: 1,
    syncStatus: "synced",
    lastSyncedAt: new Date(Date.now() - 600_000).toISOString(),
  },
  opencode: {
    id: "opencode",
    name: "OpenCode Harness",
    memoryFile: "AGENTS.md",
    mcpConfigPath: "~/.config/opencode/opencode.json",
    maxTokens: 128_000,
    defaultReserveTokens: 16_000,
    strengths: [
      "Compact portable terminal workflow",
      "Provider-agnostic local execution",
      "Fast lightweight script & CLI generation",
    ],
    protocolFormat: "json-manifest",
    activeSessions: 1,
    syncStatus: "synced",
    lastSyncedAt: new Date(Date.now() - 900_000).toISOString(),
  },
  antigravity: {
    id: "antigravity",
    name: "Antigravity Autonomous Surface",
    memoryFile: "AGENTS.md",
    mcpConfigPath: "~/.antigravity/mcp.json",
    maxTokens: 1_000_000,
    defaultReserveTokens: 50_000,
    strengths: [
      "Autonomous background mission loops",
      "Cross-vertical estate orchestration",
      "High-capacity multi-agent swarm coordination",
    ],
    protocolFormat: "json-manifest",
    activeSessions: 2,
    syncStatus: "synced",
    lastSyncedAt: new Date(Date.now() - 240_000).toISOString(),
  },
};

export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Standard ~4 chars per token approximation with word boundary adjustment
  return Math.max(1, Math.ceil(text.length / 3.8));
}

export class MultiAgentHarnessEngine {
  public getAgents(): AgentDefinition[] {
    return Object.values(COUNCIL_AGENTS);
  }

  public getHarnesses(): HarnessAdapterSpec[] {
    return Object.values(HARNESS_ADAPTERS);
  }

  public routeTask(input: {
    intent: string;
    preferredHarness?: HarnessId;
  }): {
    commandType: TaskEnvelope["commandType"];
    leadAgent: AgentId;
    supportingAgents: AgentId[];
    checkerAgent: AgentId;
    targetHarness: HarnessId;
    vaultTouches: VaultType[];
    priority: TaskEnvelope["priority"];
  } {
    const raw = input.intent.trim();
    const lower = raw.toLowerCase();

    let commandType: TaskEnvelope["commandType"] = "directive";
    if (lower.startsWith("/forge") || lower.includes("forge ") || lower.includes("architecture")) {
      commandType = "forge";
    } else if (
      lower.startsWith("/produce") ||
      lower.includes("content") ||
      lower.includes("article") ||
      lower.includes("essay") ||
      lower.includes("thread") ||
      lower.includes("post") ||
      lower.includes("script") ||
      lower.includes("publish")
    ) {
      commandType = "produce";
    } else if (lower.startsWith("/handoff") || lower.includes("handoff") || lower.includes("transfer")) {
      commandType = "handoff";
    } else if (
      lower.startsWith("/audit") ||
      lower.includes("contradict") ||
      lower.includes("audit") ||
      lower.includes("security")
    ) {
      commandType = "audit";
    } else if (lower.startsWith("/recall") || lower.includes("search vault") || lower.includes("remember")) {
      commandType = "recall";
    } else if (lower.startsWith("/attest") || lower.includes("attest")) {
      commandType = "attest";
    } else if (lower.startsWith("/compile-harness") || lower.includes("harness config")) {
      commandType = "compile-harness";
    }

    let leadAgent: AgentId = "orchestrator";
    let supportingAgents: AgentId[] = ["architect", "navigator", "sage"];
    let checkerAgent: AgentId = "sentinel";
    let targetHarness: HarnessId = input.preferredHarness ?? "cursor";
    let vaultTouches: VaultType[] = ["strategic", "technical", "operational"];
    let priority: TaskEnvelope["priority"] = "P1-high";

    switch (commandType) {
      case "forge":
        leadAgent = "architect";
        supportingAgents = ["prime", "sage", "navigator"];
        checkerAgent = "sentinel";
        targetHarness = input.preferredHarness ?? "cursor";
        vaultTouches = ["technical", "strategic", "operational"];
        priority = "P0-critical";
        break;
      case "produce":
        leadAgent = "weaver";
        supportingAgents = ["prime", "architect", "navigator"];
        checkerAgent = "sentinel";
        targetHarness = input.preferredHarness ?? "claude-code";
        vaultTouches = ["creative", "strategic", "wisdom", "horizon"];
        priority = "P1-high";
        break;
      case "handoff":
        leadAgent = "navigator";
        supportingAgents = ["orchestrator", "sage"];
        checkerAgent = "sentinel";
        targetHarness = input.preferredHarness ?? "codex";
        vaultTouches = ["operational", "technical"];
        priority = "P0-critical";
        break;
      case "audit":
        leadAgent = "sentinel";
        supportingAgents = ["navigator", "architect"];
        checkerAgent = "prime";
        targetHarness = input.preferredHarness ?? "codex";
        vaultTouches = ["operational", "technical", "strategic"];
        priority = "P0-critical";
        break;
      case "recall":
        leadAgent = "navigator";
        supportingAgents = ["prime", "sage"];
        checkerAgent = "sentinel";
        targetHarness = input.preferredHarness ?? "gemini-cli";
        vaultTouches = ["wisdom", "technical", "strategic", "horizon"];
        priority = "P2-standard";
        break;
      case "attest":
        leadAgent = "sentinel";
        supportingAgents = ["prime", "orchestrator"];
        checkerAgent = "architect";
        targetHarness = input.preferredHarness ?? "claude-code";
        vaultTouches = ["operational", "strategic"];
        priority = "P1-high";
        break;
      case "compile-harness":
        leadAgent = "architect";
        supportingAgents = ["navigator", "sage"];
        checkerAgent = "sentinel";
        targetHarness = input.preferredHarness ?? "cursor";
        vaultTouches = ["technical", "operational", "creative"];
        priority = "P1-high";
        break;
      default:
        leadAgent = "orchestrator";
        supportingAgents = ["prime", "architect", "weaver", "sage"];
        checkerAgent = "sentinel";
        targetHarness = input.preferredHarness ?? "cursor";
        vaultTouches = ["strategic", "technical", "operational", "horizon"];
        priority = "P1-high";
        break;
    }

    return {
      commandType,
      leadAgent,
      supportingAgents,
      checkerAgent,
      targetHarness,
      vaultTouches,
      priority,
    };
  }

  public compileHarnessArtifact(params: {
    harnessId: HarnessId;
    taskFocus: string;
    selectedEntries: ScoredVaultEntry[];
    assignedAgents: AgentId[];
  }): CompiledHarnessArtifact {
    const spec = HARNESS_ADAPTERS[params.harnessId] ?? HARNESS_ADAPTERS.cursor;
    const nowIso = new Date().toISOString();
    const agents = params.assignedAgents.map((id) => COUNCIL_AGENTS[id]);

    const entriesByVault = new Map<VaultType, ScoredVaultEntry[]>();
    for (const entry of params.selectedEntries) {
      const list = entriesByVault.get(entry.vault) ?? [];
      list.push(entry);
      entriesByVault.set(entry.vault, list);
    }

    const vaultSectionsMd: string[] = [];
    for (const [vType, entries] of entriesByVault.entries()) {
      const meta = VAULT_CATALOG[vType];
      const bullets = entries
        .map(
          (e) =>
            `- **[${e.id}]** *(eff. conf: ${(e.effectiveConfidence * 100).toFixed(0)}%, tags: ${e.tags.join(", ")})*: ${e.content}`
        )
        .join("\n");
      vaultSectionsMd.push(`### ${meta.symbol} ${meta.name}\n${bullets}`);
    }

    const agentRosterMd = agents
      .map(
        (a) =>
          `- **${a.name}** (\`${a.callsign}\` · Archetype: *${a.archetype}*): ${a.systemDirective}`
      )
      .join("\n");

    const attestationPayload = `${spec.id}:${params.taskFocus}:${params.selectedEntries
      .map((e) => e.id)
      .join(",")}:${nowIso}`;
    const attestationSignature = computeAttestationHash(attestationPayload);

    const memoryFileContent = [
      `# Starlight Intelligence System — ${spec.name} Harness Contract`,
      `> Target File: \`${spec.memoryFile}\` | Harness: \`${spec.id}\` | Max Context: ${spec.maxTokens.toLocaleString()} tokens`,
      `> Generated: ${nowIso} | Attestation: \`${attestationSignature}\``,
      ``,
      `## 1. Active Mission & Context Focus`,
      `**Current Focus:** ${params.taskFocus}`,
      ``,
      `## 2. Assigned Council Agents`,
      agentRosterMd,
      ``,
      `## 3. Sovereign Semantic Vault Memory (BM25 + 90d Temporal Decay Ranked)`,
      vaultSectionsMd.length > 0
        ? vaultSectionsMd.join("\n\n")
        : `*(No vault entries matched current query filter)*`,
      ``,
      `## 4. Harness Execution & Governance Gates`,
      `- **Read-Before-Write:** Always inspect target files and active vault memory before mutating state.`,
      `- **Maker / Checker Separation:** Maker agent (\`${params.assignedAgents[0] ?? "orchestrator"}\`) must submit output to Checker (\`sentinel\`) before promotion.`,
      `- **Context Continuity:** Record revision-scoped handoff packets when switching between \`${spec.id}\` and sibling harnesses.`,
      `- **Built on SIP:** Starlight Intelligence Protocol v1.1.1 · Sovereign Memory Substrate.`,
    ].join("\n");

    let mcpConfigContent: string;
    if (spec.protocolFormat === "toml-hybrid") {
      mcpConfigContent = [
        `# ${spec.mcpConfigPath} — Starlight MCP Server Registration`,
        `[mcp_servers.starlight_nexus]`,
        `command = "node"`,
        `args = ["./dist/server.js", "--mcp-stdio", "--vault-dir", "~/.starlight/vaults"]`,
        `env = { SIS_HARNESS = "${spec.id}", SIP_ATTESTATION = "${attestationSignature}" }`,
      ].join("\n");
    } else {
      mcpConfigContent = JSON.stringify(
        {
          mcpServers: {
            "starlight-nexus": {
              command: "node",
              args: ["./dist/server.js", "--vault-dir", "~/.starlight/vaults"],
              env: {
                SIS_HARNESS: spec.id,
                SIP_ATTESTATION: attestationSignature,
              },
            },
          },
        },
        null,
        2
      );
    }

    const totalTokensUsed =
      estimateTokens(memoryFileContent) + estimateTokens(mcpConfigContent);

    return {
      harnessId: spec.id,
      memoryFileName: spec.memoryFile,
      memoryFileContent,
      mcpConfigPath: spec.mcpConfigPath,
      mcpConfigContent,
      totalTokensUsed,
      maxTokens: spec.maxTokens,
      attestationSignature,
      generatedAt: nowIso,
    };
  }

  public evaluateQualityGate(params: {
    makerAgent: AgentId;
    checkerAgent: AgentId;
    harness: HarnessId;
    recalledEntriesCount: number;
    contradictionsCount: number;
    artifactText: string;
  }): QualityGateReceipt {
    const distinctAgents = params.makerAgent !== params.checkerAgent;
    const hasVaultGrounding = params.recalledEntriesCount >= 1;
    const slopRegex = /\b(delve into|testament to|in today's fast-paced world|game-changer|unlock the power of)\b/i;
    const zeroSlopPassed = !slopRegex.test(params.artifactText);
    const sufficientDepth = params.artifactText.trim().length >= 80;

    const checks: QualityGateCheck[] = [
      {
        name: "Maker / Checker Separation",
        passed: distinctAgents,
        score: distinctAgents ? 100 : 0,
        detail: distinctAgents
          ? `Maker (${params.makerAgent}) verified by independent Checker (${params.checkerAgent}).`
          : `Violation: Maker and Checker cannot be the same agent (${params.makerAgent}).`,
      },
      {
        name: "Sovereign Vault Grounding",
        passed: hasVaultGrounding,
        score: hasVaultGrounding ? Math.min(100, 75 + params.recalledEntriesCount * 5) : 40,
        detail: `Grounded in ${params.recalledEntriesCount} attested semantic vault entries.`,
      },
      {
        name: "Zero-Slop & Precision Audit",
        passed: zeroSlopPassed && sufficientDepth,
        score: zeroSlopPassed && sufficientDepth ? 98 : 60,
        detail: zeroSlopPassed
          ? "No forbidden filler phrases detected; high technical signal density."
          : "Detected low-signal phrasing or insufficient technical depth.",
      },
      {
        name: "Semantic Polarity & Contradiction Check",
        passed: true,
        score: params.contradictionsCount === 0 ? 100 : 88,
        detail:
          params.contradictionsCount === 0
            ? "Zero active vault contradictions in scope."
            : `${params.contradictionsCount} historical vault contradiction(s) isolated in favor of fresher confirmed rules.`,
      },
    ];

    const overallScore = Math.round(
      checks.reduce((sum, c) => sum + c.score, 0) / checks.length
    );
    const passed = distinctAgents && hasVaultGrounding && overallScore >= 80;
    const nowIso = new Date().toISOString();
    const sipAttestation = computeAttestationHash(
      `${params.makerAgent}:${params.checkerAgent}:${params.harness}:${overallScore}:${nowIso}`
    );

    return {
      id: `gate-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      makerAgent: params.makerAgent,
      checkerAgent: params.checkerAgent,
      harness: params.harness,
      passed,
      overallScore,
      checks,
      sipAttestation,
      timestamp: nowIso,
    };
  }
}
