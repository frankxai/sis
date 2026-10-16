import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type {
  AgentId,
  ContradictionReport,
  EntryCategory,
  HarnessId,
  ScoredVaultEntry,
  VaultEntry,
  VaultMetadata,
  VaultType,
} from "./types.js";

export const VAULT_CATALOG: Record<VaultType, VaultMetadata> = {
  strategic: {
    id: "strategic",
    name: "Strategic Vault",
    symbol: "◆",
    purpose: "Business insights, architecture decisions, and sovereign moat positioning",
    accentColor: "#7fffd4",
    exampleEntry: "Sovereign JSONL vaults with cross-harness MCP adapters outperform single-vendor cloud memory.",
  },
  technical: {
    id: "technical",
    name: "Technical Vault",
    symbol: "⬡",
    purpose: "Implementation learnings, stack decisions, retrieval algorithms, and harness contracts",
    accentColor: "#78a6ff",
    exampleEntry: "BM25 + 90-day temporal half-life decay achieves deterministic recall under 5ms for <25k entries.",
  },
  creative: {
    id: "creative",
    name: "Creative Vault",
    symbol: "✦",
    purpose: "Design systems, aesthetic rules, brand voice, and multi-channel storytelling canon",
    accentColor: "#c084fc",
    exampleEntry: "Obsidian dark technical surfaces (#07090e), aquamarine telemetry, zero decorative slop.",
  },
  operational: {
    id: "operational",
    name: "Operational Vault",
    symbol: "▸",
    purpose: "Multi-agent workflow gates, maker/checker protocols, and harness handoff discipline",
    accentColor: "#fbbf24",
    exampleEntry: "Every cross-harness handoff requires a revision SHA digest and distinct maker/checker agents.",
  },
  wisdom: {
    id: "wisdom",
    name: "Wisdom Vault",
    symbol: "◎",
    purpose: "First principles, systems thinking truths, and cross-domain synthesis",
    accentColor: "#34d399",
    exampleEntry: "Memory that compounds is intelligence that grows; unattested context decays into noise.",
  },
  horizon: {
    id: "horizon",
    name: "Horizon Vault",
    symbol: "↗",
    purpose: "Long-range vision statements and append-only ledger of sovereign human intent",
    accentColor: "#f472b6",
    exampleEntry: "Build the Jarvis-grade command substrate where human intent orchestrates a fleet of specialized harnesses.",
  },
};

const POLARITY_GROUPS: Array<[string[], string[]]> = [
  [
    ["always", "must", "require", "prefer", "enable", "adopt", "use", "enforce", "mandatory"],
    ["never", "forbid", "avoid", "disable", "reject", "prohibit", "ban", "skip", "deprecated"],
  ],
  [
    ["stateful", "centralized", "monolithic", "synchronous"],
    ["stateless", "decentralized", "modular", "asynchronous"],
  ],
];

export function computeAttestationHash(payload: string): string {
  return "sip-sha256:" + createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

export function computeTemporalConfidence(
  baseConfidence: number,
  lastConfirmedIso: string,
  nowMs: number = Date.now(),
  halfLifeDays: number = 90
): { effectiveConfidence: number; daysSinceConfirmed: number } {
  const confirmedMs = Date.parse(lastConfirmedIso);
  if (Number.isNaN(confirmedMs)) {
    return { effectiveConfidence: Number(baseConfidence.toFixed(4)), daysSinceConfirmed: 0 };
  }
  const daysSinceConfirmed = Math.max(0, (nowMs - confirmedMs) / (1000 * 60 * 60 * 24));
  const decayFactor = Math.pow(0.5, daysSinceConfirmed / halfLifeDays);
  const effectiveConfidence = Math.max(0.05, Math.min(1, baseConfidence * decayFactor));
  return {
    effectiveConfidence: Number(effectiveConfidence.toFixed(4)),
    daysSinceConfirmed: Number(daysSinceConfirmed.toFixed(1)),
  };
}

function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function buildWordTrigrams(text: string): Set<string> {
  const words = tokenizeWords(text);
  const trigrams = new Set<string>();
  if (words.length < 3) {
    words.forEach((w) => trigrams.add(w));
    return trigrams;
  }
  for (let i = 0; i <= words.length - 2; i++) {
    trigrams.add(`${words[i]}_${words[i + 1]}`);
    if (i <= words.length - 3) {
      trigrams.add(`${words[i]}_${words[i + 1]}_${words[i + 2]}`);
    }
  }
  return trigrams;
}

function computeTopicOverlap(a: VaultEntry, b: VaultEntry): number {
  const stopWords = new Set([
    "always",
    "never",
    "must",
    "should",
    "with",
    "from",
    "that",
    "this",
    "into",
    "across",
    "under",
    "every",
    "require",
    "forbid",
    "avoid",
    "prefer",
    "enable",
    "disable",
    "reject",
    "adopt",
    "use",
    "ban",
  ]);
  const wordsA = new Set(tokenizeWords(a.content).filter((w) => !stopWords.has(w)));
  const wordsB = new Set(tokenizeWords(b.content).filter((w) => !stopWords.has(w)));
  const tagsA = new Set(a.tags.map((t) => t.toLowerCase()));
  const tagsB = new Set(b.tags.map((t) => t.toLowerCase()));

  let wordInter = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) wordInter++;
  }
  const wordUnion = wordsA.size + wordsB.size - wordInter;
  const wordJaccard = wordUnion === 0 ? 0 : wordInter / wordUnion;

  let tagInter = 0;
  for (const t of tagsA) {
    if (tagsB.has(t)) tagInter++;
  }
  const tagUnion = tagsA.size + tagsB.size - tagInter;
  const tagJaccard = tagUnion === 0 ? 0 : tagInter / tagUnion;

  const triA = buildWordTrigrams(a.content);
  const triB = buildWordTrigrams(b.content);
  let triInter = 0;
  for (const t of triA) {
    if (triB.has(t)) triInter++;
  }
  const triUnion = triA.size + triB.size - triInter;
  const triJaccard = triUnion === 0 ? 0 : triInter / triUnion;

  return Number((wordJaccard * 0.55 + tagJaccard * 0.3 + triJaccard * 0.15).toFixed(4));
}

function detectPolarityConflict(textA: string, textB: string): string | null {
  const wordsA = new Set(
    textA
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
  );
  const wordsB = new Set(
    textB
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
  );

  for (const [positives, negatives] of POLARITY_GROUPS) {
    const posA = positives.find((p) => wordsA.has(p));
    const negB = negatives.find((n) => wordsB.has(n));
    if (posA && negB) {
      return `Opposing directives ("${posA}" vs "${negB}") on shared subject`;
    }
    const negA = negatives.find((n) => wordsA.has(n));
    const posB = positives.find((p) => wordsB.has(p));
    if (negA && posB) {
      return `Opposing directives ("${negA}" vs "${posB}") on shared subject`;
    }
  }
  return null;
}

export class SovereignVaultEngine {
  private entries: Map<string, VaultEntry> = new Map();
  private vaultDir?: string;

  constructor(options?: { vaultDir?: string; seedDefaults?: boolean }) {
    this.vaultDir = options?.vaultDir;
    if (this.vaultDir) {
      mkdirSync(this.vaultDir, { recursive: true });
      this.loadFromDisk();
    }
    if ((options?.seedDefaults ?? true) && this.entries.size === 0) {
      this.seedDefaultVaults();
    }
  }

  private loadFromDisk(): void {
    if (!this.vaultDir) return;
    const vaultTypes = Object.keys(VAULT_CATALOG) as VaultType[];
    for (const vType of vaultTypes) {
      const filePath = join(this.vaultDir, `${vType}.jsonl`);
      if (!existsSync(filePath)) continue;
      const raw = readFileSync(filePath, "utf8");
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed) as VaultEntry;
          if (parsed && parsed.id) {
            this.entries.set(parsed.id, parsed);
          }
        } catch {
          // Ignore malformed line
        }
      }
    }
  }

  private persistVault(vault: VaultType): void {
    if (!this.vaultDir) return;
    const filePath = join(this.vaultDir, `${vault}.jsonl`);
    const lines = Array.from(this.entries.values())
      .filter((e) => e.vault === vault)
      .map((e) => JSON.stringify(e));
    writeFileSync(filePath, lines.join("\n") + (lines.length ? "\n" : ""), "utf8");
  }

  public seedDefaultVaults(): void {
    const now = Date.now();
    const daysAgo = (d: number) => new Date(now - d * 86400_000).toISOString();

    const initialEntries: Array<
      Omit<VaultEntry, "id" | "attestationHash"> & { id?: string }
    > = [
      // STRATEGIC
      {
        id: "mem-strat-001",
        vault: "strategic",
        content:
          "Always anchor multi-agent orchestration on human-readable JSONL semantic vaults so every CLI harness shares one sovereign source of truth.",
        category: "architecture",
        tags: ["sovereignty", "vaults", "jsonl", "multi-harness"],
        confidence: 0.98,
        createdAt: daysAgo(14),
        lastConfirmed: daysAgo(2),
        sourceHarness: "claude-code",
        authorAgent: "prime",
      },
      {
        id: "mem-strat-002",
        vault: "strategic",
        content:
          "Jarvis-class operator leverage requires unifying three loops: persistent context memory, multi-harness task routing, and attested content production.",
        category: "decision",
        tags: ["jarvis", "leverage", "orchestration", "content-ops"],
        confidence: 0.96,
        createdAt: daysAgo(10),
        lastConfirmed: daysAgo(1),
        sourceHarness: "cursor",
        authorAgent: "orchestrator",
      },
      {
        id: "mem-strat-003",
        vault: "strategic",
        content:
          "Open Core protocol (SIP) paired with sovereign reference estates builds stronger ecosystem trust than opaque vendor lock-in.",
        category: "principle",
        tags: ["sip", "open-core", "ecosystem", "governance"],
        confidence: 0.94,
        createdAt: daysAgo(35),
        lastConfirmed: daysAgo(12),
        sourceHarness: "codex",
        authorAgent: "prime",
      },
      // TECHNICAL
      {
        id: "mem-tech-001",
        vault: "technical",
        content:
          "Always use hybrid BM25 lexical scoring combined with a 90-day confidence half-life decay for deterministic sub-5ms vault recall.",
        category: "pattern",
        tags: ["bm25", "retrieval", "temporal-decay", "vaults"],
        confidence: 0.97,
        createdAt: daysAgo(20),
        lastConfirmed: daysAgo(3),
        sourceHarness: "cursor",
        authorAgent: "architect",
      },
      {
        id: "mem-tech-002",
        vault: "technical",
        content:
          "Compile context packs dynamically per harness token budget: reserve 15% for system rules, 25% for active task envelope, 40% for vault recall, and 20% for episodic history.",
        category: "architecture",
        tags: ["context-budget", "tokens", "harness", "compiler"],
        confidence: 0.95,
        createdAt: daysAgo(12),
        lastConfirmed: daysAgo(1),
        sourceHarness: "claude-code",
        authorAgent: "navigator",
      },
      {
        id: "mem-tech-003",
        vault: "technical",
        content:
          "Never use BM25 lexical scoring for vault recall; disable temporal half-life decay and rely only on raw unranked dumps.",
        category: "pattern",
        tags: ["bm25", "retrieval", "temporal-decay", "vaults"],
        confidence: 0.58,
        createdAt: daysAgo(110),
        lastConfirmed: daysAgo(95),
        sourceHarness: "opencode",
        authorAgent: "sage",
      },
      {
        id: "mem-tech-004",
        vault: "technical",
        content:
          "Cross-harness handoffs must bind repository, branch, and exact git revision SHA with a cooperative lock token before transferring execution.",
        category: "decision",
        tags: ["handoff", "git", "context-bridge", "locks"],
        confidence: 0.96,
        createdAt: daysAgo(7),
        lastConfirmed: daysAgo(1),
        sourceHarness: "codex",
        authorAgent: "sentinel",
      },
      // CREATIVE
      {
        id: "mem-crea-001",
        vault: "creative",
        content:
          "Always enforce the Starlight dark technical aesthetic: obsidian surfaces (#07090e), aquamarine telemetry (#7fffd4), violet protocol badges (#c084fc), and crisp monospace metrics.",
        category: "voice",
        tags: ["design-system", "ui", "aesthetic", "telemetry"],
        confidence: 0.97,
        createdAt: daysAgo(15),
        lastConfirmed: daysAgo(2),
        sourceHarness: "cursor",
        authorAgent: "weaver",
      },
      {
        id: "mem-crea-002",
        vault: "creative",
        content:
          "Every published content artifact must pass zero-slop verification: forbid vague filler phrases, anchor claims in vault citations, and attach a SIP attestation block.",
        category: "voice",
        tags: ["content-production", "zero-slop", "sip-attest", "editorial"],
        confidence: 0.96,
        createdAt: daysAgo(9),
        lastConfirmed: daysAgo(1),
        sourceHarness: "claude-code",
        authorAgent: "weaver",
      },
      // OPERATIONAL
      {
        id: "mem-oper-001",
        vault: "operational",
        content:
          "Always require distinct Maker and Checker agents on every production task envelope and content pipeline run before issuing SIP attestation.",
        category: "workflow",
        tags: ["maker-checker", "quality-gate", "sentinel", "governance"],
        confidence: 0.99,
        createdAt: daysAgo(18),
        lastConfirmed: daysAgo(1),
        sourceHarness: "claude-code",
        authorAgent: "sentinel",
      },
      {
        id: "mem-oper-002",
        vault: "operational",
        content:
          "Never require distinct Maker and Checker agents on production task envelopes; skip Sentinel quality gate checks to ship unverified drafts.",
        category: "workflow",
        tags: ["maker-checker", "quality-gate", "sentinel", "governance"],
        confidence: 0.52,
        createdAt: daysAgo(125),
        lastConfirmed: daysAgo(105),
        sourceHarness: "opencode",
        authorAgent: "sage",
      },
      {
        id: "mem-oper-003",
        vault: "operational",
        content:
          "Read files and inspect vault context before mutating state; keep worktrees bounded and verify builds and tests on every iteration.",
        category: "workflow",
        tags: ["edit-safety", "verification", "harness-discipline"],
        confidence: 0.95,
        createdAt: daysAgo(8),
        lastConfirmed: daysAgo(2),
        sourceHarness: "cursor",
        authorAgent: "sage",
      },
      // WISDOM
      {
        id: "mem-wisd-001",
        vault: "wisdom",
        content:
          "Memory that compounds is intelligence that grows: an agent fleet without shared attested memory resets to zero at every session boundary.",
        category: "principle",
        tags: ["compounding", "memory", "first-principles", "cognition"],
        confidence: 0.99,
        createdAt: daysAgo(30),
        lastConfirmed: daysAgo(4),
        sourceHarness: "claude-code",
        authorAgent: "prime",
      },
      {
        id: "mem-wisd-002",
        vault: "wisdom",
        content:
          "Context window size is not context quality; curated high-signal context packs outperform uncurated million-token dumps in both reasoning accuracy and latency.",
        category: "principle",
        tags: ["context-engineering", "signal-to-noise", "curation"],
        confidence: 0.96,
        createdAt: daysAgo(19),
        lastConfirmed: daysAgo(3),
        sourceHarness: "gemini-cli",
        authorAgent: "navigator",
      },
      // HORIZON
      {
        id: "mem-hori-001",
        vault: "horizon",
        content:
          "Build the sovereign Jarvis command center where one human operator directs 7 specialized council agents across 6 coding and creative harnesses with full provenance.",
        category: "vision",
        tags: ["jarvis", "horizon", "sovereign-ai", "command-center"],
        confidence: 1.0,
        createdAt: daysAgo(25),
        lastConfirmed: daysAgo(1),
        sourceHarness: "claude-code",
        authorAgent: "orchestrator",
      },
      {
        id: "mem-hori-002",
        vault: "horizon",
        content:
          "Transform every engineering breakthrough and architectural decision into multi-channel technical narratives automatically via the attested Content Production Studio.",
        category: "vision",
        tags: ["content-studio", "narrative", "distribution", "compounding"],
        confidence: 0.98,
        createdAt: daysAgo(11),
        lastConfirmed: daysAgo(1),
        sourceHarness: "cursor",
        authorAgent: "weaver",
      },
    ];

    for (const item of initialEntries) {
      const id = item.id ?? `mem-${item.vault.slice(0, 4)}-${Math.random().toString(36).slice(2, 7)}`;
      const entry: VaultEntry = {
        ...item,
        id,
        attestationHash: computeAttestationHash(`${id}:${item.vault}:${item.content}`),
      };
      this.entries.set(entry.id, entry);
    }

    if (this.vaultDir) {
      for (const vType of Object.keys(VAULT_CATALOG) as VaultType[]) {
        this.persistVault(vType);
      }
    }
  }

  public getAllEntries(options?: {
    vault?: VaultType;
    includeExpired?: boolean;
  }): ScoredVaultEntry[] {
    const nowMs = Date.now();
    const list: ScoredVaultEntry[] = [];
    for (const entry of this.entries.values()) {
      if (!options?.includeExpired && entry.expired) continue;
      if (options?.vault && entry.vault !== options.vault) continue;
      const { effectiveConfidence, daysSinceConfirmed } = computeTemporalConfidence(
        entry.confidence,
        entry.lastConfirmed,
        nowMs
      );
      list.push({
        ...entry,
        effectiveConfidence,
        daysSinceConfirmed,
        relevanceScore: effectiveConfidence,
        matchedTerms: [],
      });
    }
    return list.sort((a, b) => b.effectiveConfidence - a.effectiveConfidence);
  }

  public getStats(): {
    totalEntries: number;
    activeEntries: number;
    expiredEntries: number;
    avgEffectiveConfidence: number;
    staleCount: number;
    contradictionCount: number;
    byVault: Record<
      VaultType,
      {
        count: number;
        avgConfidence: number;
        meta: VaultMetadata;
      }
    >;
  } {
    const all = this.getAllEntries({ includeExpired: true });
    const active = all.filter((e) => !e.expired);
    const stale = this.getStaleEntries(45);
    const contradictions = this.detectContradictions();

    const byVault = {} as Record<
      VaultType,
      { count: number; avgConfidence: number; meta: VaultMetadata }
    >;

    for (const vType of Object.keys(VAULT_CATALOG) as VaultType[]) {
      const vEntries = active.filter((e) => e.vault === vType);
      const avgConf =
        vEntries.length > 0
          ? Number(
              (
                vEntries.reduce((acc, item) => acc + item.effectiveConfidence, 0) /
                vEntries.length
              ).toFixed(3)
            )
          : 0;
      byVault[vType] = {
        count: vEntries.length,
        avgConfidence: avgConf,
        meta: VAULT_CATALOG[vType],
      };
    }

    const avgEffectiveConfidence =
      active.length > 0
        ? Number(
            (
              active.reduce((acc, item) => acc + item.effectiveConfidence, 0) /
              active.length
            ).toFixed(3)
          )
        : 0;

    return {
      totalEntries: all.length,
      activeEntries: active.length,
      expiredEntries: all.length - active.length,
      avgEffectiveConfidence,
      staleCount: stale.length,
      contradictionCount: contradictions.length,
      byVault,
    };
  }

  public search(params: {
    query: string;
    vault?: VaultType;
    tags?: string[];
    limit?: number;
  }): ScoredVaultEntry[] {
    const active = this.getAllEntries({ vault: params.vault, includeExpired: false });
    const queryTerms = tokenizeWords(params.query || "");
    const filterTags = (params.tags ?? []).map((t) => t.toLowerCase());

    if (queryTerms.length === 0 && filterTags.length === 0) {
      return active.slice(0, params.limit ?? 20);
    }

    // BM25-inspired parameters
    const k1 = 1.5;
    const b = 0.75;
    const docTokensList = active.map((entry) =>
      tokenizeWords(`${entry.content} ${entry.tags.join(" ")} ${entry.category} ${entry.vault}`)
    );
    const avgDocLen =
      docTokensList.reduce((sum, tokens) => sum + tokens.length, 0) /
      Math.max(1, docTokensList.length);

    // Document frequency per query term
    const docFreq: Record<string, number> = {};
    for (const qTerm of queryTerms) {
      docFreq[qTerm] = docTokensList.filter((tokens) =>
        tokens.some((t) => t === qTerm || t.includes(qTerm) || qTerm.includes(t))
      ).length;
    }

    const N = active.length;
    const scored: ScoredVaultEntry[] = [];

    for (let idx = 0; idx < active.length; idx++) {
      const entry = active[idx];
      const tokens = docTokensList[idx];

      if (filterTags.length > 0) {
        const entryTagSet = new Set(entry.tags.map((t) => t.toLowerCase()));
        const hasTag = filterTags.some((ft) => entryTagSet.has(ft));
        if (!hasTag) continue;
      }

      let bm25Score = 0;
      const matchedTerms: string[] = [];

      for (const qTerm of queryTerms) {
        const tf = tokens.filter(
          (t) => t === qTerm || (qTerm.length >= 4 && (t.includes(qTerm) || qTerm.includes(t)))
        ).length;
        if (tf > 0) {
          matchedTerms.push(qTerm);
          const df = docFreq[qTerm] || 1;
          const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
          const normTf =
            (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (tokens.length / Math.max(1, avgDocLen))));
          bm25Score += idf * normTf;
        }
      }

      // Tag boost
      const tagMatches = entry.tags.filter((t) =>
        queryTerms.some((qt) => t.toLowerCase().includes(qt))
      ).length;
      const tagBoost = tagMatches * 0.45;

      if (queryTerms.length > 0 && matchedTerms.length === 0 && tagMatches === 0) {
        continue;
      }

      // Combine lexical relevance with temporal effective confidence
      const relevanceScore = Number(
        ((bm25Score + tagBoost + 0.5) * entry.effectiveConfidence).toFixed(4)
      );

      scored.push({
        ...entry,
        relevanceScore,
        matchedTerms: Array.from(new Set(matchedTerms)),
      });
    }

    return scored
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, params.limit ?? 20);
  }

  public appendEntry(input: {
    vault: VaultType;
    content: string;
    category?: EntryCategory;
    tags?: string[];
    confidence?: number;
    sourceHarness?: HarnessId;
    authorAgent?: AgentId;
  }): ScoredVaultEntry {
    const nowIso = new Date().toISOString();
    const id = `mem-${input.vault.slice(0, 4)}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 5)}`;
    const confidence = Math.max(0.1, Math.min(1, input.confidence ?? 0.92));
    const entry: VaultEntry = {
      id,
      vault: input.vault,
      content: input.content.trim(),
      category: input.category ?? "pattern",
      tags:
        input.tags && input.tags.length > 0
          ? input.tags.map((t) => t.trim().toLowerCase()).filter(Boolean)
          : tokenizeWords(input.content).slice(0, 4),
      confidence,
      createdAt: nowIso,
      lastConfirmed: nowIso,
      sourceHarness: input.sourceHarness ?? "cursor",
      authorAgent: input.authorAgent ?? "orchestrator",
      attestationHash: computeAttestationHash(`${id}:${input.vault}:${input.content}`),
    };

    this.entries.set(entry.id, entry);
    this.persistVault(entry.vault);

    return {
      ...entry,
      effectiveConfidence: confidence,
      daysSinceConfirmed: 0,
      relevanceScore: confidence,
      matchedTerms: [],
    };
  }

  public confirmEntry(id: string): ScoredVaultEntry | null {
    const existing = this.entries.get(id);
    if (!existing) return null;
    existing.lastConfirmed = new Date().toISOString();
    existing.expired = false;
    existing.confidence = Math.min(1, Number((existing.confidence + 0.02).toFixed(3)));
    this.entries.set(id, existing);
    this.persistVault(existing.vault);

    const { effectiveConfidence, daysSinceConfirmed } = computeTemporalConfidence(
      existing.confidence,
      existing.lastConfirmed
    );
    return {
      ...existing,
      effectiveConfidence,
      daysSinceConfirmed,
      relevanceScore: effectiveConfidence,
      matchedTerms: [],
    };
  }

  public invalidateEntry(id: string): VaultEntry | null {
    const existing = this.entries.get(id);
    if (!existing) return null;
    existing.expired = true;
    this.entries.set(id, existing);
    this.persistVault(existing.vault);
    return existing;
  }

  public getStaleEntries(thresholdDays: number = 45): ScoredVaultEntry[] {
    return this.getAllEntries({ includeExpired: false }).filter(
      (entry) => entry.daysSinceConfirmed >= thresholdDays
    );
  }

  public detectContradictions(): ContradictionReport[] {
    const active = this.getAllEntries({ includeExpired: false });
    const reports: ContradictionReport[] = [];

    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i];
        const b = active[j];
        const overlap = computeTopicOverlap(a, b);
        if (overlap < 0.22) continue;

        const polarity = detectPolarityConflict(a.content, b.content);
        if (!polarity) continue;

        const severity: ContradictionReport["severity"] =
          overlap >= 0.45 ? "high" : overlap >= 0.3 ? "medium" : "low";

        const olderEntry = a.daysSinceConfirmed > b.daysSinceConfirmed ? a : b;
        const newerEntry = olderEntry.id === a.id ? b : a;

        reports.push({
          id: `contra-${a.id}-${b.id}`,
          entryA: a,
          entryB: b,
          vaultA: a.vault,
          vaultB: b.vault,
          jaccardSimilarity: overlap,
          polarityConflict: polarity,
          severity,
          recommendation: `Entry ${olderEntry.id} (${olderEntry.daysSinceConfirmed}d unconfirmed, eff. conf ${olderEntry.effectiveConfidence}) conflicts with fresher attested rule ${newerEntry.id} (${newerEntry.effectiveConfidence}). Recommend invalidating ${olderEntry.id} via sis_invalidate.`,
        });
      }
    }

    return reports.sort((x, y) => y.jaccardSimilarity - x.jaccardSimilarity);
  }
}
